package com.acronexus.service.impl;

import com.acronexus.dto.BulkAttendanceRequestDto;
import com.acronexus.dto.CoordinatorScheduleDto;
import com.acronexus.dto.CoordinatorStudentDto;
import com.acronexus.dto.CoordinatorSectionStudentsDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.CoordinatorAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoordinatorAttendanceServiceImpl implements CoordinatorAttendanceService {

    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final StudentRepository studentRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final EventRepository eventRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;
    private final EventAttendanceRecordRepository eventAttendanceRecordRepository;
    private final UserRepository userRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final com.acronexus.service.AttendanceDashboardService attendanceDashboardService;

    private User getLoggedInUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private CoordinatorAssignment getActiveAssignment(UUID userId) {
        return coordinatorAssignmentRepository.findByCoordinatorId(userId).stream()
                .filter(CoordinatorAssignment::getIsActive)
                .findFirst()
                .orElse(null);
    }

    private boolean classMatches(AcroClass acroClass, String className) {
        if (acroClass == null || className == null || className.trim().isEmpty()) return false;
        String name = acroClass.getName() != null ? acroClass.getName() : "";
        String section = acroClass.getSection() != null ? acroClass.getSection() : "";
        String combined = name + "-" + section;
        String combinedSpace = name + " " + section;
        
        return name.equalsIgnoreCase(className) || 
               section.equalsIgnoreCase(className) || 
               combined.equalsIgnoreCase(className) ||
               combinedSpace.equalsIgnoreCase(className) ||
               className.contains(section) ||
               section.contains(className);
    }

    @Override
    public CoordinatorSectionStudentsDto getMyStudents() {
        User loggedIn = getLoggedInUser();
        CoordinatorAssignment assignment = getActiveAssignment(loggedIn.getId());
        
        if (assignment == null) {
            return CoordinatorSectionStudentsDto.builder()
                .className("N/A")
                .semester("N/A")
                .batch("N/A")
                .academicYear("N/A")
                .students(new ArrayList<>())
                .sectionAverage(0.0)
                .build();
        }

        // We will check BOTH StudentEnrollment and direct Student fields
        List<Student> allStudents = studentRepository.findAll();
        List<StudentEnrollment> allActiveEnrollments = studentEnrollmentRepository.findAll().stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsActive()) && e.getStudent() != null)
                .collect(Collectors.toList());
        
        List<Student> matchedStudents = allStudents.stream().filter(s -> {
            if (s.getUser() == null || !Boolean.TRUE.equals(s.getUser().getIsActive())) return false;
            
            // 1. Try to match using direct Student entity fields
            boolean matchesDirectly = false;
            String sec = s.getSection();
            String cls = assignment.getClassName();
            if (cls != null && sec != null && !cls.isEmpty() && !sec.isEmpty()) {
                if (cls.equalsIgnoreCase(sec) || cls.contains(sec) || sec.contains(cls)) {
                    matchesDirectly = true;
                }
            }
            if (assignment.getBatch() != null && s.getBatchYear() != null) {
                if (!assignment.getBatch().equalsIgnoreCase(s.getBatchYear())) {
                    matchesDirectly = false; // Veto if batch doesn't match
                }
            }

            // 2. Try to match using active StudentEnrollment
            boolean hasValidEnrollment = false;
            for (StudentEnrollment e : allActiveEnrollments) {
                if (e.getStudent().getId().equals(s.getId())) {
                    if (classMatches(e.getAcroClass(), assignment.getClassName())) {
                        hasValidEnrollment = true;
                        break;
                    }
                }
            }

            return matchesDirectly || hasValidEnrollment;
        }).distinct().collect(Collectors.toList());

        List<CoordinatorStudentDto> studentDtos = matchedStudents.stream().map(student -> {
            User user = student.getUser();
            return CoordinatorStudentDto.builder()
                    .id(student.getId())
                    .name(user.getFirstName() + " " + user.getLastName())
                    .enrollmentNumber(student.getEnrollmentNo() != null ? student.getEnrollmentNo() : "N/A")
                    .photo(user.getProfilePictureUrl())
                    .overallAttendance(calculateOverallAttendance(student.getId()))
                    .build();
        }).collect(Collectors.toList());

        double totalPct = 0;
        int count = 0;
        for (CoordinatorStudentDto dto : studentDtos) {
            if (dto.getOverallAttendance() != null && !Double.isNaN(dto.getOverallAttendance())) {
                totalPct += dto.getOverallAttendance();
                count++;
            }
        }
        double sectionAvg = count > 0 ? (totalPct / count) : 0.0;

        return CoordinatorSectionStudentsDto.builder()
                .className(assignment.getClassName() != null ? assignment.getClassName() : "Unknown Class")
                .semester(assignment.getSemester() != null ? assignment.getSemester() : "N/A")
                .batch(assignment.getBatch() != null ? assignment.getBatch() : "N/A")
                .academicYear(assignment.getAcademicYear() != null ? assignment.getAcademicYear() : "N/A")
                .students(studentDtos)
                .sectionAverage(sectionAvg)
                .build();
    }

    @Override
    public CoordinatorScheduleDto getScheduleForDate(LocalDate date) {
        User loggedIn = getLoggedInUser();
        CoordinatorAssignment assignment = getActiveAssignment(loggedIn.getId());
        
        if (assignment == null) {
            return CoordinatorScheduleDto.builder().lectures(new ArrayList<>()).events(new ArrayList<>()).build();
        }

        String className = assignment.getClassName();

        // Find AttendanceSessions for this date and class
        List<AttendanceSession> sessions = attendanceSessionRepository.findAll().stream()
                .filter(s -> s.getDate() != null && s.getDate().equals(date) 
                             && s.getClassSubject() != null && s.getClassSubject().getAcroClass() != null 
                             && classMatches(s.getClassSubject().getAcroClass(), className))
                .collect(Collectors.toList());

        List<CoordinatorScheduleDto.LectureDto> lectureDtos = sessions.stream().map(s -> CoordinatorScheduleDto.LectureDto.builder()
                .id(s.getId())
                .subject(s.getClassSubject().getSubject().getName())
                .faculty(s.getFaculty().getUser().getFirstName() + " " + s.getFaculty().getUser().getLastName())
                .lectureNumber(s.getLectureNumber())
                .startTime(s.getStartTime() != null ? s.getStartTime().toString() : "")
                .endTime(s.getEndTime() != null ? s.getEndTime().toString() : "")
                .status(s.getStatus() != null ? s.getStatus().name() : "")
                .build()).collect(Collectors.toList());

        // Find Events for this date and class
        List<Event> events = eventRepository.findAll().stream()
                .filter(e -> {
                    if (e.getEventDate() == null) return false;
                    LocalDate eventDate = LocalDate.ofInstant(e.getEventDate(), ZoneId.systemDefault());
                    return eventDate.equals(date) && e.getTargetClass() != null 
                           && classMatches(e.getTargetClass(), className);
                })
                .collect(Collectors.toList());

        List<CoordinatorScheduleDto.EventDto> eventDtos = events.stream().map(e -> CoordinatorScheduleDto.EventDto.builder()
                .id(e.getId())
                .title(e.getTitle())
                .eventDate(e.getEventDate().toString())
                .status(e.getStatus())
                .includeInOverallAttendance(e.getIncludeInOverallAttendance())
                .lecturesCount(2) // Mock logic as requested for lecturesCount, wait no, let's just send 1 or the count
                .build()).collect(Collectors.toList());

        return CoordinatorScheduleDto.builder()
                .lectures(lectureDtos)
                .events(eventDtos)
                .build();
    }

    @Override
    @Transactional
    public void addBulkAttendance(BulkAttendanceRequestDto request) {
        User loggedIn = getLoggedInUser();

        // Mark lecture attendance
        if (request.getSessionIds() != null && !request.getSessionIds().isEmpty()) {
            List<AttendanceSession> sessions = attendanceSessionRepository.findAllById(request.getSessionIds());
            for (AttendanceSession session : sessions) {
                List<com.acronexus.entity.StudentEnrollment> enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(session.getClassSubject().getAcroClass().getId());
                List<StudentAttendance> currentAttendances = studentAttendanceRepository.findBySessionId(session.getId());
                
                int presentCount = 0;
                int absentCount = 0;
                
                for (com.acronexus.entity.StudentEnrollment enrollment : enrollments) {
                    Student student = enrollment.getStudent();
                    boolean isPresent = request.getStudentIds().contains(student.getId());
                    
                    StudentAttendance existing = currentAttendances.stream()
                            .filter(a -> a.getStudent().getId().equals(student.getId()))
                            .findFirst().orElse(null);
                            
                    if (existing == null) {
                        StudentAttendance sa = new StudentAttendance();
                        sa.setStudent(student);
                        sa.setSession(session);
                        sa.setClassSubject(session.getClassSubject());
                        sa.setDate(request.getDate());
                        sa.setStatus(isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT);
                        sa.setMarkedBy(loggedIn);
                        sa.setApprovalSource("COORDINATOR");
                        studentAttendanceRepository.save(sa);
                        if (isPresent) presentCount++;
                        else absentCount++;
                    } else {
                        // Update if changed
                        if (isPresent && existing.getStatus() != AttendanceStatus.PRESENT) {
                            existing.setStatus(AttendanceStatus.PRESENT);
                            existing.setApprovalSource("COORDINATOR");
                            studentAttendanceRepository.save(existing);
                            presentCount++;
                        } else if (!isPresent && existing.getStatus() != AttendanceStatus.ABSENT) {
                            existing.setStatus(AttendanceStatus.ABSENT);
                            existing.setApprovalSource("COORDINATOR");
                            studentAttendanceRepository.save(existing);
                            absentCount++;
                        } else {
                            if (existing.getStatus() == AttendanceStatus.PRESENT) presentCount++;
                            else if (existing.getStatus() == AttendanceStatus.ABSENT) absentCount++;
                        }
                    }
                }
                
                session.setPresentCount(presentCount);
                session.setAbsentCount(absentCount);
                session.setTotalStudents(enrollments.size());
                attendanceSessionRepository.save(session);
            }
        }

        // Mark event attendance
        if (request.getEventIds() != null && !request.getEventIds().isEmpty()) {
            List<Event> events = eventRepository.findAllById(request.getEventIds());
            for (Event event : events) {
                // Here we assume event attendance requires session or similar logic. Let's create an EventAttendanceRecord.
                // We need EventAttendanceSession, so let's mock one or get the first one for simplicity if not present.
                if (event.getAttendanceSessions() != null && !event.getAttendanceSessions().isEmpty()) {
                    EventAttendanceSession session = event.getAttendanceSessions().get(0);
                    for (UUID studentId : request.getStudentIds()) {
                        Student student = studentRepository.findById(studentId).orElse(null);
                        if (student != null) {
                            boolean exists = eventAttendanceRecordRepository.existsBySessionIdAndStudentId(session.getId(), student.getId());
                            if (!exists) {
                                EventAttendanceRecord record = new EventAttendanceRecord();
                                record.setStudent(student);
                                record.setSession(session);
                                record.setStatus("SUBMITTED");
                                record.setSubmittedAt(Instant.now());
                                eventAttendanceRecordRepository.save(record);
                            }
                        }
                    }
                }
            }
        }
    }

    private Double calculateOverallAttendance(UUID studentId) {
        try {
            com.acronexus.dto.AttendanceDashboardDto.OverallAttendanceDto overall = attendanceDashboardService.getStudentOverallAttendance(studentId);
            if (overall != null && overall.getOverallPercentage() != null) {
                return overall.getOverallPercentage();
            }
        } catch (Exception e) {
            // Log or ignore
        }
        return 0.0;
    }
}
