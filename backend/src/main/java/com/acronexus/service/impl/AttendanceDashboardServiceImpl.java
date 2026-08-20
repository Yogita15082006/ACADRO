package com.acronexus.service.impl;

import com.acronexus.dto.AttendanceDashboardDto.*;
import com.acronexus.entity.FacultyActivity;
import com.acronexus.entity.StudentAttendance;
import com.acronexus.repository.FacultyActivityRepository;
import com.acronexus.repository.StudentAttendanceRepository;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.StudentEnrollmentRepository;
import com.acronexus.repository.TimetableRepository;
import com.acronexus.repository.TimetableSlotRepository;
import com.acronexus.service.AttendanceDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Month;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceDashboardServiceImpl implements AttendanceDashboardService {

    private final StudentAttendanceRepository studentAttendanceRepository;
    private final FacultyActivityRepository facultyActivityRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final TimetableRepository timetableRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final com.acronexus.repository.EventAttendanceRecordRepository eventAttendanceRecordRepository;
    private final com.acronexus.repository.SemesterRepository semesterRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Override
    public List<StudentAttendanceHistoryDto> getStudentAttendanceHistory(UUID studentId) {
        List<StudentAttendance> allRecords = studentAttendanceRepository.findByStudentIdOrderByDateDesc(studentId);
        List<StudentAttendanceHistoryDto> result = new ArrayList<>();
        
        // Group by Date
        java.util.Map<java.time.LocalDate, List<StudentAttendance>> groupedByDate = allRecords.stream()
                .collect(Collectors.groupingBy(StudentAttendance::getDate));
                
        // Process each date in descending order
        allRecords.stream().map(StudentAttendance::getDate).distinct().forEach(date -> {
            List<StudentAttendance> recordsForDate = groupedByDate.get(date);
            boolean hasPresent = recordsForDate.stream()
                    .anyMatch(r -> com.acronexus.entity.AttendanceStatus.PRESENT.equals(r.getStatus()));
                    
            if (hasPresent) {
                // Lecture-wise: just map them normally and set absenceType to Lecture-wise for non-present
                for (StudentAttendance sa : recordsForDate) {
                    StudentAttendanceHistoryDto dto = mapToStudentAttendanceHistoryDto(sa);
                    if (!com.acronexus.entity.AttendanceStatus.PRESENT.equals(sa.getStatus())) {
                        dto.setAbsenceType("Lecture-wise");
                    }
                    result.add(dto);
                }
            } else {
                // Full Day: collapse all non-present into a single record
                if (!recordsForDate.isEmpty()) {
                    StudentAttendance first = recordsForDate.get(0);
                    StudentAttendanceHistoryDto fullDayDto = mapToStudentAttendanceHistoryDto(first);
                    fullDayDto.setSubjectName("All");
                    fullDayDto.setAbsenceType("Full Day");
                    // Keep status as it is (likely ABSENT or PENDING)
                    result.add(fullDayDto);
                }
            }
        });
        
        return result;
    }

    @Override
    public List<SubjectAttendanceDto> getStudentSubjectWiseAttendance(UUID studentId) {
        java.util.Optional<com.acronexus.entity.StudentEnrollment> enrollmentOpt = studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(studentId);
        
        java.util.Map<String, SubjectAttendanceDto> subjectMap = new java.util.LinkedHashMap<>();
        
        if (enrollmentOpt.isPresent() && enrollmentOpt.get().getAcroClass() != null) {
            com.acronexus.entity.AcroClass acroClass = enrollmentOpt.get().getAcroClass();
            List<com.acronexus.entity.ClassSubject> classSubjects = classSubjectRepository.findByAcroClassIdAndIsActiveTrue(acroClass.getId());
            
            com.acronexus.entity.Timetable activeTimetable = null;
            if (enrollmentOpt.get().getAcademicYear() != null && enrollmentOpt.get().getSemester() != null) {
                List<com.acronexus.entity.Timetable> timetables = timetableRepository.findByAcroClassIdAndAcademicYearIdAndSemesterIdOrderByVersionNumberDesc(
                    acroClass.getId(), enrollmentOpt.get().getAcademicYear().getId(), enrollmentOpt.get().getSemester().getId());
                if (!timetables.isEmpty()) {
                    activeTimetable = timetables.get(0);
                }
            }
            
            List<com.acronexus.entity.TimetableSlot> activeSlots = activeTimetable != null ? timetableSlotRepository.findByTimetableId(activeTimetable.getId()) : new ArrayList<>();
            LocalDate semesterEndDate = enrollmentOpt.get().getSemester() != null ? enrollmentOpt.get().getSemester().getEndDate() : null;
            
            for (com.acronexus.entity.ClassSubject cs : classSubjects) {
                if (cs.getSubject() != null) {
                    String subjectName = cs.getSubject().getName();
                    String facultyName = "N/A";
                    if (cs.getFaculty() != null && cs.getFaculty().getUser() != null) {
                        String firstName = cs.getFaculty().getUser().getFirstName();
                        String lastName = cs.getFaculty().getUser().getLastName();
                        facultyName = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
                        facultyName = facultyName.trim();
                    }
                    
                    int futureScheduled = calculateFutureScheduledClasses(cs, activeSlots, semesterEndDate);
                    
                    subjectMap.put(subjectName, SubjectAttendanceDto.builder()
                            .subjectName(subjectName)
                            .facultyName(facultyName)
                            .totalClasses(0)
                            .classesAttended(0)
                            .classesMissed(0)
                            .attendancePercentage(0.0)
                            .futureScheduledClasses(futureScheduled)
                            .neededFor75(0)
                            .neededFor80(0)
                            .safeToMiss(0)
                            .build());
                }
            }
        }
        
        List<Object[]> results = studentAttendanceRepository.getSubjectWiseAttendance(studentId, enrollmentOpt.get().getAcademicYear().getId(), enrollmentOpt.get().getSemester().getId());
        for (Object[] row : results) {
            String subjectName = (String) row[0];
            String facultyFirstName = (String) row[1];
            String facultyLastName = (String) row[2];
            String facultyName = (facultyFirstName != null ? facultyFirstName : "") + " " + (facultyLastName != null ? facultyLastName : "");
            facultyName = facultyName.trim();
            Integer totalClasses = ((Number) row[3]).intValue();
            Integer classesAttended = ((Number) row[4]).intValue();
            Integer classesMissed = ((Number) row[5]).intValue();
            Double percentage = totalClasses == 0 ? 0.0 : (double) classesAttended / totalClasses * 100.0;
            
            SubjectAttendanceDto dto = subjectMap.getOrDefault(subjectName, SubjectAttendanceDto.builder()
                    .subjectName(subjectName)
                    .facultyName(facultyName)
                    .futureScheduledClasses(0)
                    .build());
                    
            dto.setTotalClasses(totalClasses);
            dto.setClassesAttended(classesAttended);
            dto.setClassesMissed(classesMissed);
            dto.setAttendancePercentage(percentage);
            
            int futureScheduled = dto.getFutureScheduledClasses() != null ? dto.getFutureScheduledClasses() : 0;
            if (futureScheduled < 0) {
                futureScheduled = Math.max(0, -futureScheduled - totalClasses);
                dto.setFutureScheduledClasses(futureScheduled);
            }
            
            dto.setNeededFor75(calculateNeededFor(0.75, totalClasses, classesAttended, futureScheduled));
            dto.setNeededFor80(calculateNeededFor(0.80, totalClasses, classesAttended, futureScheduled));
            dto.setSafeToMiss(calculateSafeToMiss(0.75, totalClasses, classesAttended, futureScheduled));
            
            subjectMap.put(subjectName, dto);
        }
        
        for (SubjectAttendanceDto dto : subjectMap.values()) {
            if (dto.getTotalClasses() == null || dto.getTotalClasses() == 0) {
                int futureScheduled = dto.getFutureScheduledClasses() != null ? dto.getFutureScheduledClasses() : 0;
                if (futureScheduled < 0) {
                    futureScheduled = -futureScheduled;
                    dto.setFutureScheduledClasses(futureScheduled);
                }
                dto.setNeededFor75(calculateNeededFor(0.75, 0, 0, futureScheduled));
                dto.setNeededFor80(calculateNeededFor(0.80, 0, 0, futureScheduled));
                dto.setSafeToMiss(calculateSafeToMiss(0.75, 0, 0, futureScheduled));
            }
        }
        
        return new ArrayList<>(subjectMap.values());
    }

    private int calculateFutureScheduledClasses(com.acronexus.entity.ClassSubject classSubject, List<com.acronexus.entity.TimetableSlot> allSlots, LocalDate semesterEndDate) {
        if (allSlots == null || allSlots.isEmpty()) {
            int theory = classSubject.getSyllabusSubject() != null && classSubject.getSyllabusSubject().getTheoryHours() != null ? classSubject.getSyllabusSubject().getTheoryHours() : 0;
            int practical = classSubject.getSyllabusSubject() != null && classSubject.getSyllabusSubject().getPracticalHours() != null ? classSubject.getSyllabusSubject().getPracticalHours() : 0;
            int totalSyllabus = theory + practical > 0 ? theory + practical : 45; 
            return -totalSyllabus; // Return negative to indicate we need to subtract conducted later
        }
        
        LocalDate now = LocalDate.now();
        if (semesterEndDate == null) {
            semesterEndDate = now.plusMonths(4);
        }
        if (semesterEndDate.isBefore(now)) {
            return 0;
        }
        
        int count = 0;
        for (LocalDate d = now; !d.isAfter(semesterEndDate); d = d.plusDays(1)) {
            String dayName = d.getDayOfWeek().name();
            for (com.acronexus.entity.TimetableSlot slot : allSlots) {
                if (slot.getSubject() != null && slot.getSubject().getId().equals(classSubject.getSubject().getId())) {
                    if (slot.getDayOfWeek().equalsIgnoreCase(dayName)) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    private int calculateNeededFor(double target, int conducted, int attended, int futureScheduled) {
        if (conducted == 0) return -2;
        int needed = (int) Math.ceil((target * conducted - attended) / (1.0 - target));
        if (needed <= 0) return 0;
        if (needed > futureScheduled) return -1;
        return needed;
    }

    private int calculateSafeToMiss(double target, int conducted, int attended, int futureScheduled) {
        if (conducted == 0) return 0;
        if (((double) attended / conducted) < target) return 0;
        int m = (int) Math.floor(attended + futureScheduled - target * (conducted + futureScheduled));
        if (m < 0) return 0;
        return Math.min(m, futureScheduled);
    }

    @Override
    public OverallAttendanceDto getStudentOverallAttendance(UUID studentId, UUID academicYearId, UUID semesterId) {
        String studentName = "Student";
        String email = "N/A";
        String semesterStr = "N/A";
        String className = "N/A";
        String profilePictureUrl = null;

        java.util.Optional<com.acronexus.entity.StudentEnrollment> enrollmentOpt = studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(studentId);
        if (enrollmentOpt.isPresent()) {
            com.acronexus.entity.StudentEnrollment enr = enrollmentOpt.get();
            if (academicYearId == null && enr.getAcademicYear() != null) {
                academicYearId = enr.getAcademicYear().getId();
            }
            if (semesterId == null && enr.getSemester() != null) {
                semesterId = enr.getSemester().getId();
            }
            
            if (enr.getStudent() != null && enr.getStudent().getUser() != null) {
                com.acronexus.entity.User u = enr.getStudent().getUser();
                studentName = (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "");
                studentName = studentName.trim();
                email = u.getEmail() != null ? u.getEmail() : "N/A";
                if (u.getProfilePictureUrl() != null && !u.getProfilePictureUrl().isEmpty()) {
                    profilePictureUrl = u.getProfilePictureUrl();
                }
            }
            if (enr.getSemester() != null) {
                semesterStr = String.valueOf(enr.getSemester().getSemesterNumber());
            }
            if (enr.getAcroClass() != null) {
                className = enr.getAcroClass().getName();
                if (enr.getAcroClass().getSection() != null && !enr.getAcroClass().getSection().isEmpty()) {
                    className += "-" + enr.getAcroClass().getSection();
                }
            }
        }

        Object result = studentAttendanceRepository.getOverallAttendance(studentId, academicYearId, semesterId);
        Integer totalWorkingDays = 0;
        Integer daysPresent = 0;
        Integer totalClasses = 0;
        Integer totalPresent = 0;

        if (result != null) {
            Object[] row = (Object[]) result;
            totalWorkingDays = row[0] != null ? ((Number) row[0]).intValue() : 0;
            daysPresent = row[1] != null ? ((Number) row[1]).intValue() : 0;
            totalClasses = row[2] != null ? ((Number) row[2]).intValue() : 0;
            totalPresent = row[3] != null ? ((Number) row[3]).intValue() : 0;
        }

        // Integrate Event Attendance Contribution
        java.time.Instant startInstant = java.time.Instant.MIN;
        java.time.Instant endInstant = java.time.Instant.MAX;
        if (semesterId != null) {
            com.acronexus.entity.Semester sem = semesterRepository.findById(semesterId).orElse(null);
            if (sem != null) {
                if (sem.getStartDate() != null) startInstant = sem.getStartDate().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                if (sem.getEndDate() != null) endInstant = sem.getEndDate().plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
            }
        }
        
        List<com.acronexus.entity.EventAttendanceRecord> eventRecords = eventAttendanceRecordRepository
                .findByStudentIdAndSessionIsIncludedInOverallTrueAndSessionStatus(studentId, "CLOSED", startInstant, endInstant);
        for (com.acronexus.entity.EventAttendanceRecord rec : eventRecords) {
            String selectedLecturesStr = rec.getSession().getSelectedLectures();
            if (selectedLecturesStr != null && !selectedLecturesStr.isEmpty()) {
                try {
                    List<String> selectedLectures = objectMapper.readValue(selectedLecturesStr, 
                            new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){});
                    int lectureCount = selectedLectures.size();
                    totalClasses += lectureCount;
                    if ("SUBMITTED".equals(rec.getStatus())) {
                        totalPresent += lectureCount;
                    }
                } catch (Exception e) {
                    // Skip if JSON parse fails
                }
            }
        }

        if (totalClasses == 0) {
            return OverallAttendanceDto.builder()
                    .studentName(studentName).email(email).semester(semesterStr).className(className).profilePictureUrl(profilePictureUrl)
                    .totalWorkingDays(0).daysPresent(0).daysAbsent(0)
                    .totalClasses(0).totalPresent(0).totalAbsent(0).classesMissed(0)
                    .overallPercentage(0.0)
                    .build();
        }
        
        Integer daysAbsent = totalWorkingDays - daysPresent;
        Integer classesMissed = totalClasses - totalPresent;
        Double percentage = (double) totalPresent / totalClasses * 100.0;
        
        return OverallAttendanceDto.builder()
                .studentName(studentName)
                .email(email)
                .semester(semesterStr)
                .className(className)
                .profilePictureUrl(profilePictureUrl)
                .totalWorkingDays(totalWorkingDays)
                .daysPresent(daysPresent)
                .daysAbsent(daysAbsent)
                .totalClasses(totalClasses)
                .totalPresent(totalPresent)
                .totalAbsent(classesMissed) // keeping totalAbsent for backward compatibility if needed
                .classesMissed(classesMissed)
                .overallPercentage(percentage)
                .build();
    }

    @Override
    public java.util.Map<UUID, OverallAttendanceDto> getStudentOverallAttendanceInBulk(List<UUID> studentIds, UUID academicYearId, UUID semesterId) {
        if (studentIds == null || studentIds.isEmpty()) return new java.util.HashMap<>();
        
        java.util.Map<UUID, OverallAttendanceDto> map = new java.util.HashMap<>();
        
        // If academicYearId or semesterId is null, we can't reliably query in bulk without a term.
        // We will just fall back to passing null (which will match nothing unless we fix the query or we don't query).
        // Since getOverallAttendanceInBulk is strictly used by Coordinator Dashboard which provides these IDs, it should be fine.
        
        // 1. Get standard attendance in bulk
        List<Object[]> bulkAttendance = studentAttendanceRepository.getOverallAttendanceInBulk(studentIds, academicYearId, semesterId);
        java.util.Map<UUID, Integer> totalClassesMap = new java.util.HashMap<>();
        java.util.Map<UUID, Integer> totalPresentMap = new java.util.HashMap<>();
        java.util.Map<UUID, Integer> totalWorkingDaysMap = new java.util.HashMap<>();
        java.util.Map<UUID, Integer> daysPresentMap = new java.util.HashMap<>();
        
        for (Object[] row : bulkAttendance) {
            UUID sid = (UUID) row[0];
            totalWorkingDaysMap.put(sid, row[1] != null ? ((Number) row[1]).intValue() : 0);
            daysPresentMap.put(sid, row[2] != null ? ((Number) row[2]).intValue() : 0);
            totalClassesMap.put(sid, row[3] != null ? ((Number) row[3]).intValue() : 0);
            totalPresentMap.put(sid, row[4] != null ? ((Number) row[4]).intValue() : 0);
        }
        
        // 2. Get event attendance in bulk
        java.time.Instant startInstant = java.time.Instant.MIN;
        java.time.Instant endInstant = java.time.Instant.MAX;
        if (semesterId != null) {
            com.acronexus.entity.Semester sem = semesterRepository.findById(semesterId).orElse(null);
            if (sem != null) {
                if (sem.getStartDate() != null) startInstant = sem.getStartDate().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                if (sem.getEndDate() != null) endInstant = sem.getEndDate().plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
            }
        }
        
        List<com.acronexus.entity.EventAttendanceRecord> eventRecords = eventAttendanceRecordRepository
                .findByStudentIdInAndSessionIsIncludedInOverallTrueAndSessionStatus(studentIds, "CLOSED", startInstant, endInstant);
                
        for (com.acronexus.entity.EventAttendanceRecord rec : eventRecords) {
            UUID sid = rec.getStudent().getId();
            String selectedLecturesStr = rec.getSession().getSelectedLectures();
            if (selectedLecturesStr != null && !selectedLecturesStr.isEmpty()) {
                try {
                    List<String> selectedLectures = objectMapper.readValue(selectedLecturesStr, 
                            new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){});
                    int lectureCount = selectedLectures.size();
                    totalClassesMap.put(sid, totalClassesMap.getOrDefault(sid, 0) + lectureCount);
                    if ("SUBMITTED".equals(rec.getStatus())) {
                        totalPresentMap.put(sid, totalPresentMap.getOrDefault(sid, 0) + lectureCount);
                    }
                } catch (Exception e) {
                    // Skip
                }
            }
        }
        
        // 3. Build DTOs
        for (UUID sid : studentIds) {
            int tc = totalClassesMap.getOrDefault(sid, 0);
            int tp = totalPresentMap.getOrDefault(sid, 0);
            int twd = totalWorkingDaysMap.getOrDefault(sid, 0);
            int dp = daysPresentMap.getOrDefault(sid, 0);
            int missed = tc - tp;
            int daysAbsent = twd - dp;
            double pct = tc > 0 ? (double) tp / tc * 100.0 : 0.0;
            
            map.put(sid, OverallAttendanceDto.builder()
                    .totalClasses(tc)
                    .totalPresent(tp)
                    .classesMissed(missed)
                    .totalAbsent(missed)
                    .totalWorkingDays(twd)
                    .daysPresent(dp)
                    .daysAbsent(daysAbsent)
                    .overallPercentage(pct)
                    .build());
        }
        
        return map;
    }

    @Override
    public List<MonthlyAttendanceDto> getStudentMonthlyAttendance(UUID studentId, UUID academicYearId, UUID semesterId) {
        // Group by month
        // We will fetch for the current year or last 6 months, or we can just fetch all and group in memory for simplicity.
        // The repository method expects a specific month. Since we need multiple, we could loop over months, 
        // or just fetch all and group in Java. But repository has findMonthlyAttendance taking 'month' parameter.
        List<MonthlyAttendanceDto> dtos = new ArrayList<>();
        // Fetch for current month and previous 5 months (or just a fixed set). Since the method signature expects us to return List<MonthlyAttendanceDto>, let's just do 1 to 12 or current month.
        // Assuming we return the last 6 months for the semester.
        java.time.LocalDate now = java.time.LocalDate.now();
        for (int i = 0; i < 6; i++) {
            java.time.LocalDate targetMonth = now.minusMonths(i);
            int monthVal = targetMonth.getMonthValue();
            List<StudentAttendance> records = studentAttendanceRepository.findMonthlyAttendance(studentId, monthVal, academicYearId, semesterId);
            if (!records.isEmpty()) {
                int totalClasses = records.size();
                int present = (int) records.stream().filter(r -> r.getStatus().name().equals("PRESENT")).count();
                int absent = totalClasses - present;
                Double percentage = totalClasses == 0 ? 0.0 : (double) present / totalClasses * 100.0;
                
                OverallAttendanceDto summary = OverallAttendanceDto.builder()
                        .totalClasses(totalClasses)
                        .totalPresent(present)
                        .totalAbsent(absent)
                        .overallPercentage(percentage)
                        .build();
                
                dtos.add(MonthlyAttendanceDto.builder()
                        .month(monthVal)
                        .monthName(Month.of(monthVal).name())
                        .summary(summary)
                        .records(records.stream().map(this::mapToStudentAttendanceHistoryDto).collect(Collectors.toList()))
                        .build());
            }
        }
        return dtos;
    }

    @Override
    public List<FacultyAttendanceHistoryDto> getFacultyAttendanceHistory(UUID facultyId) {
        List<FacultyActivity> activities = facultyActivityRepository.findByFacultyIdOrderByDateDesc(facultyId);
        return mapActivitiesToFacultyHistory(activities);
    }

    @Override
    public List<DailyAttendanceRegisterDto> getDailyAttendanceRegister(UUID classSubjectId, java.time.LocalDate date) {
        return studentAttendanceRepository.findByClassSubjectIdAndDate(classSubjectId, date).stream()
                .map(sa -> DailyAttendanceRegisterDto.builder()
                        .studentId(sa.getStudent().getId())
                        .studentName(sa.getStudent().getUser().getFirstName() + " " + sa.getStudent().getUser().getLastName())
                        .enrollmentNumber(sa.getStudent().getEnrollmentNo())
                        .status(sa.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public ClassAttendanceSummaryDto getClassAttendanceSummary(UUID classSubjectId) {
        Object result = studentAttendanceRepository.getClassAttendanceSummary(classSubjectId);
        if (result == null) {
            return ClassAttendanceSummaryDto.builder()
                    .totalStudents(0).present(0).absent(0).percentage(0.0)
                    .build();
        }
        Object[] row = (Object[]) result;
        String className = (String) row[0];
        String subjectName = (String) row[1];
        Integer totalStudents = ((Number) row[2]).intValue();
        Integer present = ((Number) row[3]).intValue();
        Integer absent = ((Number) row[4]).intValue();
        Double percentage = totalStudents == 0 ? 0.0 : (double) present / totalStudents * 100.0;
        
        return ClassAttendanceSummaryDto.builder()
                .className(className)
                .subjectName(subjectName)
                .totalStudents(totalStudents)
                .present(present)
                .absent(absent)
                .percentage(percentage)
                .build();
    }

    @Override
    public List<StudentAttendanceHistoryDto> adminStudentAttendanceLookup(String enrollmentNo, String studentName) {
        return studentAttendanceRepository.findByEnrollmentNoOrStudentName(enrollmentNo, studentName).stream()
                .map(this::mapToStudentAttendanceHistoryDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<FacultyAttendanceHistoryDto> adminFacultyAttendanceLookup(String facultyName, String employeeId) {
        return mapActivitiesToFacultyHistory(facultyActivityRepository.findByFacultyNameOrEmployeeId(facultyName, employeeId));
    }

    @Override
    public List<FacultyAttendanceHistoryDto> adminClassAttendanceLookup(UUID academicYearId, UUID semesterId, UUID classId, UUID subjectId) {
        return mapActivitiesToFacultyHistory(facultyActivityRepository.findByClassAttendanceLookup(academicYearId, semesterId, classId, subjectId));
    }

    private StudentAttendanceHistoryDto mapToStudentAttendanceHistoryDto(StudentAttendance sa) {
        String day = sa.getDate() != null ? 
sa.getDate().getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH) : "";
        String time = "N/A";
        if (sa.getSession() != null && sa.getSession().getCreatedAt() != null) {
            time = java.time.format.DateTimeFormatter.ofPattern("hh:mm a")
                    .format(sa.getSession().getCreatedAt().withZoneSameInstant(java.time.ZoneId.systemDefault()));
        }
        
        return StudentAttendanceHistoryDto.builder()
                .date(sa.getDate())
                .day(day)
                .time(time)
                .subjectName(sa.getClassSubject() != null && sa.getClassSubject().getSubject() != null ? sa.getClassSubject().getSubject().getName() : "")
                .facultyName(sa.getSession() != null && sa.getSession().getFaculty() != null && sa.getSession().getFaculty().getUser() != null ? sa.getSession().getFaculty().getUser().getFirstName() + " " + sa.getSession().getFaculty().getUser().getLastName() : "N/A") 
                .status(sa.getStatus())
                .sessionId(sa.getSession() != null ? sa.getSession().getId() : null)
                .classSubjectId(sa.getClassSubject() != null ? sa.getClassSubject().getId() : null)
                .topic(sa.getSession() != null ? sa.getSession().getTopic() : null)
                .markedTime(sa.getCreatedAt() != null ? sa.getCreatedAt().toInstant() : null)
                .build();
    }

    private List<FacultyAttendanceHistoryDto> mapActivitiesToFacultyHistory(List<FacultyActivity> activities) {
        if (activities == null || activities.isEmpty()) return new ArrayList<>();

        List<FacultyActivity> validActivities = activities.stream()
                .filter(fa -> fa.getReason() != null && fa.getReason().startsWith("SESSION:"))
                .collect(Collectors.toList());
        
        if (validActivities.isEmpty()) return new ArrayList<>();

        List<UUID> classSubjectIds = validActivities.stream()
                .map(fa -> fa.getClassSubject().getId())
                .distinct()
                .collect(Collectors.toList());

        List<Object[]> counts = studentAttendanceRepository.getAttendanceCountsForClassSubjects(classSubjectIds);
        
        java.util.Map<String, int[]> countMap = new java.util.HashMap<>();
        for (Object[] row : counts) {
            UUID csId = (UUID) row[0];
            java.time.LocalDate date = (java.time.LocalDate) row[1];
            int present = ((Number) row[2]).intValue();
            int absent = ((Number) row[3]).intValue();
            countMap.put(csId.toString() + "_" + date.toString(), new int[]{present, absent});
        }

        return validActivities.stream().map(fa -> {
            String key = fa.getClassSubject().getId().toString() + "_" + fa.getDate().toString();
            int[] presentAbsent = countMap.getOrDefault(key, new int[]{0, 0});
            
            String sessionIdStr = fa.getReason().replace("SESSION:", "");
            UUID sessionId = null;
            try {
                sessionId = UUID.fromString(sessionIdStr);
            } catch (IllegalArgumentException ignored) {}

            return FacultyAttendanceHistoryDto.builder()
                    .sessionId(sessionId)
                    .date(fa.getDate())
                    .subjectName(fa.getClassSubject().getSubject().getName())
                    .className(fa.getClassSubject().getAcroClass().getName())
                    .totalPresent(presentAbsent[0])
                    .totalAbsent(presentAbsent[1])
                    .build();
        }).collect(Collectors.toList());
    }
}
