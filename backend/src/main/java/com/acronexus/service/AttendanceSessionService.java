package com.acronexus.service;

import com.acronexus.dto.AttendanceSessionDTO;
import com.acronexus.dto.CreateAttendanceSessionRequest;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.acronexus.dto.TeachingHistoryDTO;

@Service
@RequiredArgsConstructor
public class AttendanceSessionService {

    private final AttendanceSessionRepository sessionRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final FacultyRepository facultyRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final StudentAttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final FacultyActivityRepository facultyActivityRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;

    public java.util.Map<String, Object> getFacultyStatistics(UUID facultyId) {
        java.util.Set<java.time.LocalDate> workingDates = sessionRepository.findWorkingDatesByFacultyId(facultyId);
        java.util.Set<java.time.LocalDate> absentDates = new java.util.HashSet<>(facultyActivityRepository.findAbsentDatesByFacultyId(facultyId));

        // A working date cancels out any absent mark on the same date
        absentDates.removeAll(workingDates);

        long daysPresent = workingDates.size();
        long daysAbsent = absentDates.size();
        long totalWorkingDays = daysPresent + daysAbsent;
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("daysPresent", daysPresent);
        stats.put("daysAbsent", daysAbsent);
        stats.put("totalWorkingDays", totalWorkingDays);
        return stats;
    }

    @Transactional(readOnly = true)
    public List<TeachingHistoryDTO> getTeachingHistory(UUID facultyId) {
        List<ClassSubject> classSubjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(facultyId);
        List<AttendanceSession> sessions = sessionRepository.findByFacultyId(facultyId);
        
        return classSubjects.stream().map(cs -> {
            List<AttendanceSession> csSessions = sessions.stream()
                    .filter(s -> s.getClassSubject() != null && s.getClassSubject().getId().equals(cs.getId()) &&
                            (s.getStatus() == AttendanceSessionStatus.COMPLETED || s.getStatus() == AttendanceSessionStatus.SAVED || s.getStatus() == AttendanceSessionStatus.CLOSED))
                    .collect(Collectors.toList());
                    
            long totalScheduled = csSessions.size();
            long conducted = csSessions.stream().filter(s -> s.getIsSystemGenerated() == null || !s.getIsSystemGenerated()).count();
            long missed = csSessions.stream().filter(s -> Boolean.TRUE.equals(s.getIsSystemGenerated())).count();
            int overallAttendance = totalScheduled > 0 ? Math.round(((float) conducted / totalScheduled) * 100) : 0;
            
            String batch = "-";
            if (cs.getAcroClass() != null) {
                List<CoordinatorAssignment> assignments = coordinatorAssignmentRepository.findByClassNameAndIsActiveTrue(cs.getAcroClass().getName());
                if (!assignments.isEmpty() && assignments.get(0).getBatch() != null) {
                    batch = assignments.get(0).getBatch();
                }
            }
            
            String year = cs.getAcademicYear() != null ? cs.getAcademicYear().getYear().replace("YEAR_", "") : "-";
            String semester = cs.getSemester() != null ? String.valueOf(cs.getSemester().getSemesterNumber()) : "-";
            String className = cs.getAcroClass() != null ? cs.getAcroClass().getName() : "-";
            String subjectName = cs.getSubject() != null ? cs.getSubject().getName() : "-";
            
            return TeachingHistoryDTO.builder()
                    .classSubjectId(cs.getId())
                    .batch(batch)
                    .year(year)
                    .semester(semester)
                    .className(className)
                    .subjectName(subjectName)
                    .totalScheduled(totalScheduled)
                    .conducted(conducted)
                    .missed(missed)
                    .overallAttendance(overallAttendance)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public AttendanceSessionDTO generateAiSession(UUID facultyId, UUID classSubjectId) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new RuntimeException("ClassSubject not found"));

        if (!classSubject.getFaculty().getId().equals(facultyId)) {
            throw new RuntimeException("Unauthorized: You do not teach this subject.");
        }

        AttendanceSession session = new AttendanceSession();
        session.setFaculty(classSubject.getFaculty());
        session.setClassSubject(classSubject);
        session.setType("Faculty CLASS_MISSED");
        session.setLectureNumber("AI Generated");
        session.setTopic("Auto-generated Session (AI)");
        session.setDate(java.time.LocalDate.now());
        session.setStartTime(java.time.LocalTime.of(10, 0));
        session.setEndTime(java.time.LocalTime.of(11, 0));
        session.setDuration("60");
        session.setCode(String.format("%06d", new java.util.Random().nextInt(999999)));
        session.setRequireVerification(false);
        session.setUniqueCodeCount(0);
        session.setStatus(AttendanceSessionStatus.ACTIVE);
        session.setIsSystemGenerated(true);
        session.setFacultyReason("AI Generated Missed Session");

        int totalStudents = (int) studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classSubject.getAcroClass().getId())
                .stream()
                .filter(e -> e.getAcademicYear() != null && e.getSemester() != null
                        && classSubject.getAcademicYear() != null && classSubject.getSemester() != null
                        && e.getAcademicYear().getId().equals(classSubject.getAcademicYear().getId())
                        && e.getSemester().getId().equals(classSubject.getSemester().getId()))
                .count();
        session.setTotalStudents(totalStudents);

        session = sessionRepository.save(session);
        return mapToDTO(session);
    }

    private final StudentAttendanceHistoryRepository historyRepository;
    private final org.springframework.web.client.RestTemplate aiServiceRestTemplate;
    private final com.acronexus.config.AiServiceProperties aiServiceProperties;

    @Transactional
    public AttendanceSessionDTO createSession(UUID facultyId, CreateAttendanceSessionRequest request) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        ClassSubject classSubject = classSubjectRepository.findById(request.getClassSubjectId())
                .orElseThrow(() -> new RuntimeException("Class Subject not found"));

        AttendanceSession session = new AttendanceSession();
        session.setFaculty(faculty);
        session.setClassSubject(classSubject);
        session.setType(request.getType());
        session.setLectureNumber(request.getLectureNumber());
        session.setTopic(request.getTopic());
        session.setDate(request.getDate());
        session.setStartTime(request.getStartTime());
        session.setEndTime(request.getEndTime());
        session.setDuration(request.getDuration());
        session.setCode(request.getCode());
        session.setRequireVerification(request.getRequireVerification());
        session.setVerificationQuestion(request.getVerificationQuestion());
        session.setExpectedAnswer(request.getExpectedAnswer());
        session.setUniqueCodeCount(request.getUniqueCodeCount());
        session.setStatus(AttendanceSessionStatus.ACTIVE);
        
        // Calculate total students
        int totalStudents = (int) studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classSubject.getAcroClass().getId())
                .stream()
                .filter(e -> e.getAcademicYear() != null && e.getSemester() != null
                        && classSubject.getAcademicYear() != null && classSubject.getSemester() != null
                        && e.getAcademicYear().getId().equals(classSubject.getAcademicYear().getId())
                        && e.getSemester().getId().equals(classSubject.getSemester().getId()))
                .count();
        session.setTotalStudents(totalStudents);

        session = sessionRepository.save(session);
        return mapToDTO(session);
    }

    @Transactional
    public AttendanceSessionDTO createSystemGeneratedSession(FacultyActivity activity) {
        if (activity.getClassSubject() == null) {
            return null;
        }
        
        com.acronexus.entity.ClassSubject classSubject = classSubjectRepository.findById(activity.getClassSubject().getId())
                .orElseThrow(() -> new RuntimeException("ClassSubject not found"));

        AttendanceSession session = new AttendanceSession();
        session.setFaculty(activity.getFaculty());
        session.setClassSubject(classSubject);
        session.setType("Faculty " + activity.getStatus().name());
        session.setLectureNumber(String.valueOf(activity.getLectureNumber()));
        session.setTopic("Auto-generated Session");
        session.setDate(activity.getDate());
        session.setStartTime(java.time.LocalTime.of(10, 0)); // default time
        session.setEndTime(java.time.LocalTime.of(11, 0)); // default time
        session.setDuration("60");
        session.setCode(String.format("%06d", new java.util.Random().nextInt(999999)));
        session.setRequireVerification(false);
        session.setUniqueCodeCount(0);
        session.setStatus(AttendanceSessionStatus.ACTIVE);
        session.setIsSystemGenerated(true);
        session.setFacultyReason(activity.getReason());

        int totalStudents = (int) studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classSubject.getAcroClass().getId())
                .stream()
                .filter(e -> e.getAcademicYear() != null && e.getSemester() != null
                        && classSubject.getAcademicYear() != null && classSubject.getSemester() != null
                        && e.getAcademicYear().getId().equals(classSubject.getAcademicYear().getId())
                        && e.getSemester().getId().equals(classSubject.getSemester().getId()))
                .count();
        session.setTotalStudents(totalStudents);

        session = sessionRepository.save(session);
        return mapToDTO(session);
    }

    @Transactional(readOnly = true)
    public List<AttendanceSessionDTO> getFacultySessions(UUID facultyId) {
        return sessionRepository.findByFacultyId(facultyId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceSessionDTO> getActiveSessionsForClass(UUID classSubjectId) {
        return sessionRepository.findByClassSubjectIdAndStatus(classSubjectId, AttendanceSessionStatus.ACTIVE).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(noRollbackFor = com.acronexus.exception.AttendanceValidationException.class)
    public void markAttendance(UUID sessionId, com.acronexus.dto.MarkAttendanceRequest request, UUID userId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != AttendanceSessionStatus.ACTIVE) {
            throw new RuntimeException("Session is not active");
        }

        Student student = studentRepository.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
                
        // Check if student is actively enrolled in the class for the correct academic year and semester
        boolean isEnrolled = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(session.getClassSubject().getAcroClass().getId()).stream()
                .anyMatch(e -> e.getStudent().getId().equals(student.getId()) 
                        && e.getAcademicYear() != null 
                        && e.getAcademicYear().getId().equals(session.getClassSubject().getAcademicYear().getId())
                        && e.getSemester() != null
                        && e.getSemester().getId().equals(session.getClassSubject().getSemester().getId()));
        
        if (!isEnrolled) {
            throw new RuntimeException("You are not enrolled in this class subject for the current academic year and semester.");
        }

        // Check if already marked (only block if present, pending, or conflict)
        boolean alreadyMarked = attendanceRepository.findByStudentIdOrderByDateDesc(student.getId()).stream()
                .anyMatch(a -> a.getSession() != null && a.getSession().getId().equals(sessionId) &&
                        (a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.PENDING || a.getStatus() == AttendanceStatus.CONFLICT));
        if (alreadyMarked) {
            throw new RuntimeException("Attendance already marked for this session");
        }

        // Find existing REJECTED row to update, or create new
        StudentAttendance attendance = attendanceRepository.findByStudentIdOrderByDateDesc(student.getId()).stream()
                .filter(a -> a.getSession() != null && a.getSession().getId().equals(sessionId) && a.getStatus() == AttendanceStatus.REJECTED)
                .findFirst().orElse(new StudentAttendance());

        attendance.setSession(session);
        attendance.setStudent(student);
        attendance.setClassSubject(session.getClassSubject());
        attendance.setDate(session.getDate());
        attendance.setUniqueCode(request.getUniqueCode());
        attendance.setVerificationAnswer(request.getVerificationAnswer());
        attendance.setSubmissionTime(java.time.LocalTime.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS));
        attendance.setMarkedBy(student.getUser());

        if (session.getCode() != null && !session.getCode().equalsIgnoreCase(request.getAttendanceCode())) {
            attendance.setStatus(AttendanceStatus.REJECTED);
            attendance.setVerificationStatus("INVALID_CODE");
            attendanceRepository.save(attendance);
            throw new com.acronexus.exception.AttendanceValidationException("Invalid attendance code");
        }

        if (Boolean.TRUE.equals(session.getIsSystemGenerated())) {
            // Bypass unique code and verification for system-generated requests
            attendance.setStatus(AttendanceStatus.PENDING);
        } else {
            if (session.getUniqueCodeCount() != null && session.getUniqueCodeCount() > 0) {
                if (request.getUniqueCode() == null || request.getUniqueCode() < 1 || request.getUniqueCode() > session.getUniqueCodeCount()) {
                    attendance.setStatus(AttendanceStatus.REJECTED);
                    attendance.setVerificationStatus("INVALID_UNIQUE_CODE");
                    attendanceRepository.save(attendance);
                    throw new com.acronexus.exception.AttendanceValidationException("Invalid unique code. Must be between 1 and " + session.getUniqueCodeCount());
                }
            }
            if (Boolean.TRUE.equals(session.getRequireVerification())) {
                if (session.getExpectedAnswer() != null && !session.getExpectedAnswer().equalsIgnoreCase(request.getVerificationAnswer())) {
                    attendance.setStatus(AttendanceStatus.REJECTED);
                    attendance.setVerificationStatus("FAILED");
                    attendanceRepository.save(attendance);
                    throw new com.acronexus.exception.AttendanceValidationException("Verification answer is incorrect");
                }
                attendance.setVerificationStatus("PASSED");
            }

            // Check for unique code conflict
            List<StudentAttendance> allForSession = attendanceRepository.findBySessionId(sessionId);
            boolean conflict = false;
            for (StudentAttendance existing : allForSession) {
                if (existing.getUniqueCode() != null && existing.getUniqueCode().equals(request.getUniqueCode()) && !existing.getId().equals(attendance.getId())) {
                    if (existing.getStatus() == AttendanceStatus.PRESENT) {
                        existing.setStatus(AttendanceStatus.CONFLICT);
                        attendanceRepository.save(existing);
                        session.setPresentCount(Math.max(0, session.getPresentCount() - 1));
                    }
                    conflict = true;
                }
            }

            if (conflict) {
                attendance.setStatus(AttendanceStatus.CONFLICT);
            } else {
                attendance.setStatus(AttendanceStatus.PRESENT);
                session.setPresentCount(session.getPresentCount() + 1);
            }
        }
        
        attendanceRepository.save(attendance);
        sessionRepository.save(session);
    }

    @Transactional
    public AttendanceSessionDTO updateSessionStatus(UUID sessionId, AttendanceSessionStatus newStatus) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        session.setStatus(newStatus);
        
        if (newStatus == AttendanceSessionStatus.CLOSED || newStatus == AttendanceSessionStatus.SAVED) {
            int total = session.getTotalStudents() != null ? session.getTotalStudents() : 0;
            int present = session.getPresentCount() != null ? session.getPresentCount() : 0;
            session.setAbsentCount(Math.max(0, total - present));
            
            // Mark remaining students as absent if not already marked
            UUID targetAcademicYearId = session.getClassSubject().getAcademicYear() != null ? session.getClassSubject().getAcademicYear().getId() : null;
            UUID targetSemesterId = session.getClassSubject().getSemester() != null ? session.getClassSubject().getSemester().getId() : null;

            List<StudentEnrollment> enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(session.getClassSubject().getAcroClass().getId())
                    .stream()
                    .filter(e -> e.getAcademicYear() != null && e.getSemester() != null
                            && targetAcademicYearId != null && targetSemesterId != null
                            && e.getAcademicYear().getId().equals(targetAcademicYearId)
                            && e.getSemester().getId().equals(targetSemesterId))
                    .collect(Collectors.toList());
            List<StudentAttendance> currentAttendances = attendanceRepository.findBySessionId(sessionId);
            
            for (StudentEnrollment enrollment : enrollments) {
                boolean hasAttendance = currentAttendances.stream()
                        .anyMatch(a -> a.getStudent().getId().equals(enrollment.getStudent().getId()));
                        
                if (!hasAttendance) {
                    StudentAttendance absentRecord = new StudentAttendance();
                    absentRecord.setSession(session);
                    absentRecord.setStudent(enrollment.getStudent());
                    absentRecord.setClassSubject(session.getClassSubject());
                    absentRecord.setDate(session.getDate());
                    absentRecord.setStatus(AttendanceStatus.ABSENT);
                    attendanceRepository.save(absentRecord);
                }
            }
        }
        
        if (newStatus == AttendanceSessionStatus.SAVED && !Boolean.TRUE.equals(session.getIsSystemGenerated())) {
            boolean activityExists = facultyActivityRepository.existsByFacultyIdAndClassSubjectIdAndDate(
                    session.getFaculty().getId(),
                    session.getClassSubject().getId(),
                    session.getDate()
            );
            if (!activityExists) {
                FacultyActivity activity = new FacultyActivity();
                activity.setFaculty(session.getFaculty());
                activity.setClassSubject(session.getClassSubject());
                activity.setDate(session.getDate());
                activity.setLectureNumber(Integer.parseInt(session.getLectureNumber().replaceAll("[^0-9]", "").isEmpty() ? "1" : session.getLectureNumber().replaceAll("[^0-9]", "")));
                activity.setStatus(FacultyActivityStatus.PRESENT);
                activity.setMarkedBy(session.getFaculty().getUser());
                facultyActivityRepository.save(activity);
            }
        }
        
        session = sessionRepository.save(session);
        return mapToDTO(session);
    }
    
    @Transactional
    public void addStudentToHistory(UUID sessionId, String enrollmentNumber) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
                
        Student student = studentRepository.findByEnrollmentNo(enrollmentNumber)
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("Student with enrollment number " + enrollmentNumber + " not found"));
                
        // Validate if student belongs to the same class as the session
        boolean isEnrolled = studentEnrollmentRepository.existsByStudentIdAndAcroClassIdAndIsActiveTrue(
                student.getId(), session.getClassSubject().getAcroClass().getId());
                
        if (!isEnrolled) {
            throw new RuntimeException("Student does not belong to this class/section");
        }
                
        List<StudentAttendance> currentAttendances = attendanceRepository.findBySessionId(sessionId);
        
        for (StudentAttendance attendance : currentAttendances) {
            if (attendance.getStudent().getId().equals(student.getId())) {
                if (attendance.getStatus() != AttendanceStatus.PRESENT) {
                    if (attendance.getStatus() == AttendanceStatus.ABSENT) {
                        session.setAbsentCount(Math.max(0, session.getAbsentCount() - 1));
                    }
                    attendance.setStatus(AttendanceStatus.PRESENT);
                    attendance.setSubmissionTime(java.time.LocalTime.now());
                    attendanceRepository.save(attendance);
                    
                    session.setPresentCount(session.getPresentCount() + 1);
                    sessionRepository.save(session);
                }
                return;
            }
        }
        
        // If no record exists, create one
        StudentAttendance newAttendance = new StudentAttendance();
        newAttendance.setSession(session);
        newAttendance.setStudent(student);
        newAttendance.setClassSubject(session.getClassSubject());
        newAttendance.setDate(session.getDate());
        newAttendance.setStatus(AttendanceStatus.PRESENT);
        newAttendance.setSubmissionTime(java.time.LocalTime.now());
        attendanceRepository.save(newAttendance);
        
        session.setPresentCount(session.getPresentCount() + 1);
        sessionRepository.save(session);
    }
    
    @Transactional
    public void deleteSession(UUID sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        historyRepository.deleteBySessionId(sessionId);
        attendanceRepository.deleteBySessionId(sessionId);
        sessionRepository.delete(session);
    }

    @Transactional(readOnly = true)
    public List<com.acronexus.dto.StudentAttendanceRecordDTO> getLiveResponses(UUID sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) return new java.util.ArrayList<>();
        
        List<StudentEnrollment> activeEnrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(session.getClassSubject().getAcroClass().getId());
        
        return attendanceRepository.findBySessionId(sessionId).stream()
            .filter(a -> activeEnrollments.stream().anyMatch(e -> 
                e.getStudent().getId().equals(a.getStudent().getId())
                && e.getAcademicYear() != null && e.getAcademicYear().getId().equals(session.getClassSubject().getAcademicYear().getId())
                && e.getSemester() != null && e.getSemester().getId().equals(session.getClassSubject().getSemester().getId())
            ))
            .map(a -> {
            com.acronexus.dto.StudentAttendanceRecordDTO dto = new com.acronexus.dto.StudentAttendanceRecordDTO();
            dto.setStudentId(a.getStudent().getId());
            dto.setEnrollmentNumber(a.getStudent().getEnrollmentNo());
            dto.setName(a.getStudent().getUser().getFirstName() + " " + a.getStudent().getUser().getLastName());
            dto.setAvatar(a.getStudent().getUser().getProfilePictureUrl() != null ? a.getStudent().getUser().getProfilePictureUrl() : "/avatars/default.png");
            dto.setStatus(a.getStatus().name());
            dto.setTime(a.getSubmissionTime() != null ? a.getSubmissionTime().toString() : "-");
            dto.setAnswer(a.getVerificationAnswer() != null ? a.getVerificationAnswer() : "-");
            dto.setVerificationResult(a.getVerificationStatus() != null ? a.getVerificationStatus() : "-");
            dto.setUniqueCode(a.getUniqueCode());
            return dto;
        }).collect(Collectors.toList());
    }

    private AttendanceSessionDTO mapToDTO(AttendanceSession session) {
        AttendanceSessionDTO dto = new AttendanceSessionDTO();
        dto.setId(session.getId());
        dto.setClassSubjectId(session.getClassSubject() != null ? session.getClassSubject().getId() : null);
        dto.setFacultyId(session.getFaculty() != null ? session.getFaculty().getId() : null);
        dto.setSubjectName(session.getClassSubject() != null && session.getClassSubject().getSubject() != null ? session.getClassSubject().getSubject().getName() : "");
        dto.setFacultyName(session.getFaculty() != null && session.getFaculty().getUser() != null ? session.getFaculty().getUser().getFirstName() + " " + session.getFaculty().getUser().getLastName() : "");
        dto.setAcademicYear(session.getClassSubject() != null && session.getClassSubject().getAcademicYear() != null ? session.getClassSubject().getAcademicYear().getYear() : "");
        dto.setDepartment(session.getClassSubject() != null && session.getClassSubject().getAcroClass() != null && session.getClassSubject().getAcroClass().getDepartment() != null ? session.getClassSubject().getAcroClass().getDepartment().getName() : "");
        dto.setClassName(session.getClassSubject() != null && session.getClassSubject().getAcroClass() != null ? session.getClassSubject().getAcroClass().getName() : "");
        dto.setType(session.getType());
        dto.setLectureNumber(session.getLectureNumber());
        dto.setTopic(session.getTopic());
        dto.setDate(session.getDate());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        dto.setDuration(session.getDuration());
        dto.setCode(session.getCode());
        dto.setRequireVerification(session.getRequireVerification());
        dto.setVerificationQuestion(session.getVerificationQuestion());
        dto.setExpectedAnswer(session.getExpectedAnswer());
        dto.setUniqueCodeCount(session.getUniqueCodeCount());
        dto.setStatus(session.getStatus().name());
        dto.setPresentCount(session.getPresentCount());
        dto.setAbsentCount(session.getAbsentCount());
        dto.setTotalStudents(session.getTotalStudents());
        dto.setCreatedAt(session.getCreatedAt() != null ? session.getCreatedAt().toInstant() : null);
        dto.setIsSystemGenerated(session.getIsSystemGenerated());
        dto.setFacultyReason(session.getFacultyReason());
        return dto;
    }

    @Transactional
    public void respondToRequest(UUID sessionId, UUID attendanceId, boolean accept) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
                
        StudentAttendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));
                
        if (attendance.getStatus() != AttendanceStatus.PENDING) {
            throw new RuntimeException("Attendance is not pending");
        }
        
        if (accept) {
            attendance.setStatus(AttendanceStatus.PRESENT);
            session.setPresentCount(session.getPresentCount() + 1);
        } else {
            attendance.setStatus(AttendanceStatus.ABSENT);
            session.setAbsentCount(session.getAbsentCount() + 1);
        }
        
        attendanceRepository.save(attendance);
        sessionRepository.save(session);
    }
    @Transactional
    public void bulkApproveText(UUID sessionId, String text) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
                
        java.util.Set<String> matchedEnrollments = new java.util.HashSet<>();
        if (text != null) {
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\b[a-zA-Z0-9]{10,14}\\b").matcher(text);
            while (matcher.find()) {
                matchedEnrollments.add(matcher.group().toUpperCase());
            }
        }

        List<StudentEnrollment> enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(session.getClassSubject().getAcroClass().getId());
        List<StudentAttendance> currentAttendances = attendanceRepository.findBySessionId(sessionId);
        
        int presentCount = 0;
        
        for (StudentEnrollment enrollment : enrollments) {
            String enrollNo = enrollment.getStudent().getEnrollmentNo().toUpperCase();
            
            StudentAttendance attendance = currentAttendances.stream()
                    .filter(a -> a.getStudent().getId().equals(enrollment.getStudent().getId()))
                    .findFirst()
                    .orElse(null);
                    
            boolean isMatched = matchedEnrollments.contains(enrollNo);
            
            if (attendance == null) {
                attendance = new StudentAttendance();
                attendance.setSession(session);
                attendance.setStudent(enrollment.getStudent());
                attendance.setClassSubject(session.getClassSubject());
                attendance.setDate(session.getDate());
                
                if (isMatched) {
                    attendance.setStatus(AttendanceStatus.PRESENT);
                    presentCount++;
                } else {
                    attendance.setStatus(AttendanceStatus.ABSENT);
                }
                attendanceRepository.save(attendance);
            } else {
                if (isMatched) {
                    attendance.setStatus(AttendanceStatus.PRESENT);
                    presentCount++;
                } else {
                    if (attendance.getStatus() == AttendanceStatus.PENDING) {
                        attendance.setStatus(AttendanceStatus.REJECTED);
                    } else if (attendance.getStatus() != AttendanceStatus.PRESENT) {
                        attendance.setStatus(AttendanceStatus.ABSENT);
                    } else {
                        presentCount++;
                    }
                }
                attendanceRepository.save(attendance);
            }
        }
        
        session.setPresentCount(presentCount);
        session.setAbsentCount(enrollments.size() - presentCount);
        sessionRepository.save(session);
    }

    @Transactional
    public void bulkApprovePhoto(UUID sessionId, org.springframework.web.multipart.MultipartFile file) {
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA);

            org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            body.add("file", new org.springframework.core.io.ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg";
                }
            });

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = new org.springframework.http.HttpEntity<>(body, headers);

            String url = aiServiceProperties.getBaseUrl() + "/extract-enrollments";
            org.springframework.http.ResponseEntity<java.util.Map> response = aiServiceRestTemplate.postForEntity(url, requestEntity, java.util.Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                java.util.List<String> enrollmentsList = (java.util.List<String>) response.getBody().get("enrollments");
                String rawText = (String) response.getBody().get("raw_text");
                String textToParse = enrollmentsList != null ? String.join(" ", enrollmentsList) : rawText;
                bulkApproveText(sessionId, textToParse);
            } else {
                throw new RuntimeException("Failed to extract text from photo");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error communicating with AI service: " + e.getMessage(), e);
        }
    }

    public String debugDbCheck() { return "ok"; }
    public void bulkApplyReview(java.util.UUID sessionId, com.acronexus.dto.BulkApplyReviewRequest request) {}
    public void bulkRespondToRequests(java.util.UUID sessionId, com.acronexus.dto.BulkRespondRequest request) {}
}
