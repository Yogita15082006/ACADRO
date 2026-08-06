package com.acronexus.service.impl;

import com.acronexus.dto.AttendanceDashboardDto.*;
import com.acronexus.entity.FacultyActivity;
import com.acronexus.entity.StudentAttendance;
import com.acronexus.repository.FacultyActivityRepository;
import com.acronexus.repository.StudentAttendanceRepository;
import com.acronexus.service.AttendanceDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Month;
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

    @Override
    public List<StudentAttendanceHistoryDto> getStudentAttendanceHistory(UUID studentId) {
        return studentAttendanceRepository.findByStudentIdOrderByDateDesc(studentId).stream()
                .map(this::mapToStudentAttendanceHistoryDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SubjectAttendanceDto> getStudentSubjectWiseAttendance(UUID studentId) {
        List<Object[]> results = studentAttendanceRepository.getSubjectWiseAttendance(studentId);
        return results.stream().map(row -> {
            String subjectName = (String) row[0];
            Integer totalClasses = ((Number) row[1]).intValue();
            Integer classesAttended = ((Number) row[2]).intValue();
            Integer classesMissed = ((Number) row[3]).intValue();
            Double percentage = totalClasses == 0 ? 0.0 : (double) classesAttended / totalClasses * 100.0;
            return SubjectAttendanceDto.builder()
                    .subjectName(subjectName)
                    .totalClasses(totalClasses)
                    .classesAttended(classesAttended)
                    .classesMissed(classesMissed)
                    .attendancePercentage(percentage)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public OverallAttendanceDto getStudentOverallAttendance(UUID studentId) {
        Object result = studentAttendanceRepository.getOverallAttendance(studentId);
        if (result == null) {
            return OverallAttendanceDto.builder()
                    .totalClasses(0).totalPresent(0).totalAbsent(0).overallPercentage(0.0)
                    .build();
        }
        Object[] row = (Object[]) result;
        Integer totalClasses = row[0] != null ? ((Number) row[0]).intValue() : 0;
        Integer totalPresent = row[1] != null ? ((Number) row[1]).intValue() : 0;
        Integer totalAbsent = row[2] != null ? ((Number) row[2]).intValue() : 0;
        Double percentage = totalClasses == 0 ? 0.0 : (double) totalPresent / totalClasses * 100.0;
        
        return OverallAttendanceDto.builder()
                .totalClasses(totalClasses)
                .totalPresent(totalPresent)
                .totalAbsent(totalAbsent)
                .overallPercentage(percentage)
                .build();
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
        return StudentAttendanceHistoryDto.builder()
                .date(sa.getDate())
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
