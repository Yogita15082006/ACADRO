package com.acronexus.service.impl;

import com.acronexus.dto.AttendanceReportDto.*;
import com.acronexus.repository.*;
import com.acronexus.service.AttendanceDashboardService;
import com.acronexus.service.AttendanceReportService;
import com.acronexus.entity.FacultyActivity;
import com.acronexus.entity.StudentEnrollment;
import com.acronexus.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceReportServiceImpl implements AttendanceReportService {

    private final StudentAttendanceRepository studentAttendanceRepository;
    private final FacultyActivityRepository facultyActivityRepository;
    private final DepartmentRepository departmentRepository;
    private final AttendanceDashboardService dashboardService;
    private final com.acronexus.service.AiService aiService;
    private final StudentEnrollmentRepository studentEnrollmentRepository;

    // Helper for eligibility calculation
    private EligibilityReportDto calculateEligibility(UUID studentId, String firstName, String lastName, String enrollmentNo, int totalClasses, int presentClasses, double threshold) {
        double percentage = totalClasses == 0 ? 0.0 : (double) presentClasses / totalClasses * 100.0;
        boolean isEligible = percentage >= threshold;
        int requiredClasses = 0;

        if (!isEligible && totalClasses > 0) {
            double target = threshold / 100.0;
            double numerator = (target * totalClasses) - presentClasses;
            double denominator = 1.0 - target;
            if (denominator > 0) {
                requiredClasses = (int) Math.ceil(numerator / denominator);
            }
        }

        return EligibilityReportDto.builder()
                .studentId(studentId)
                .studentName(firstName + " " + lastName)
                .enrollmentNo(enrollmentNo)
                .totalClasses(totalClasses)
                .presentClasses(presentClasses)
                .attendancePercentage(percentage)
                .isEligible(isEligible)
                .requiredClassesToBecomeEligible(requiredClasses)
                .build();
    }

    @Override
    public List<EligibilityReportDto> getClassEligibilityReport(UUID classId, Double threshold) {
        List<Object[]> summary = studentAttendanceRepository.getClassStudentAttendanceSummary(classId);
        List<EligibilityReportDto> report = new ArrayList<>();
        
        for (Object[] row : summary) {
            UUID studentId = (UUID) row[0];
            String firstName = (String) row[1];
            String lastName = (String) row[2];
            String enrollmentNo = (String) row[3];
            int totalClasses = ((Number) row[4]).intValue();
            int presentClasses = ((Number) row[5]).intValue();
            
            report.add(calculateEligibility(studentId, firstName, lastName, enrollmentNo, totalClasses, presentClasses, threshold));
        }
        
        return report;
    }

    @Override
    public FacultyReportDto getFacultyReport(UUID facultyId, LocalDate startDate, LocalDate endDate) {
        List<FacultyActivity> activities = facultyActivityRepository.findByFacultyIdOrderByDateDesc(facultyId).stream()
                .filter(fa -> fa.getReason() != null && fa.getReason().startsWith("SESSION:"))
                .filter(fa -> (startDate == null || !fa.getDate().isBefore(startDate)) && 
                              (endDate == null || !fa.getDate().isAfter(endDate)))
                .collect(Collectors.toList());

        if (activities.isEmpty()) {
            return FacultyReportDto.builder()
                    .facultyId(facultyId)
                    .classesConducted(0)
                    .totalSessions(0)
                    .averageAttendancePercentage(0.0)
                    .totalStudentsAttended(0)
                    .totalAbsentees(0)
                    .build();
        }

        List<UUID> classSubjectIds = activities.stream()
                .map(fa -> fa.getClassSubject().getId())
                .distinct()
                .collect(Collectors.toList());

        List<Object[]> counts = studentAttendanceRepository.getAttendanceCountsForClassSubjects(classSubjectIds);
        
        java.util.Map<String, int[]> countMap = new java.util.HashMap<>();
        for (Object[] row : counts) {
            UUID csId = (UUID) row[0];
            LocalDate date = (LocalDate) row[1];
            int present = ((Number) row[2]).intValue();
            int absent = ((Number) row[3]).intValue();
            countMap.put(csId.toString() + "_" + date.toString(), new int[]{present, absent});
        }

        int totalSessions = activities.size();
        int totalPresent = 0;
        int totalAbsent = 0;
        
        for (FacultyActivity fa : activities) {
            String key = fa.getClassSubject().getId().toString() + "_" + fa.getDate().toString();
            int[] pa = countMap.getOrDefault(key, new int[]{0, 0});
            totalPresent += pa[0];
            totalAbsent += pa[1];
        }
        
        int totalPossible = totalPresent + totalAbsent;
        double avgAttendance = totalPossible == 0 ? 0.0 : (double) totalPresent / totalPossible * 100.0;
        String facultyName = activities.get(0).getFaculty().getUser().getFirstName() + " " + activities.get(0).getFaculty().getUser().getLastName();

        return FacultyReportDto.builder()
                .facultyId(facultyId)
                .facultyName(facultyName)
                .classesConducted(classSubjectIds.size())
                .totalSessions(totalSessions)
                .averageAttendancePercentage(avgAttendance)
                .totalStudentsAttended(totalPresent)
                .totalAbsentees(totalAbsent)
                .build();
    }

    @Override
    public StudentReportDto getStudentReport(UUID studentId, UUID academicYearId, UUID semesterId) {
        if (academicYearId == null || semesterId == null) {
            StudentEnrollment enrollment = studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("No active enrollment found for student"));
            if (academicYearId == null) academicYearId = enrollment.getAcademicYear().getId();
            if (semesterId == null) semesterId = enrollment.getSemester().getId();
        }

        com.acronexus.dto.AttendanceDashboardDto.OverallAttendanceDto overall = dashboardService.getStudentOverallAttendance(studentId, null, null);
        List<com.acronexus.dto.AttendanceDashboardDto.SubjectAttendanceDto> subjectWise = dashboardService.getStudentSubjectWiseAttendance(studentId);
        List<com.acronexus.dto.AttendanceDashboardDto.MonthlyAttendanceDto> monthly = dashboardService.getStudentMonthlyAttendance(studentId, academicYearId, semesterId);
        
        // Fetch student name directly from DB using repository if possible, or leave blank if not needed immediately.
        // We will do a generic approach since student info is not entirely fetched by dashboard service.
        double threshold = 75.0; // Default configurable
        EligibilityReportDto eligibility = calculateEligibility(studentId, "Student", "", "", overall.getTotalClasses(), overall.getTotalPresent(), threshold);

        return StudentReportDto.builder()
                .studentId(studentId)
                .studentName("Student Name") // In a full implementation, we'd fetch the student entity
                .enrollmentNo("Enrollment No")
                .overallAttendancePercentage(overall.getOverallPercentage())
                .subjectWiseAttendance(subjectWise)
                .monthlyAttendance(monthly)
                .isEligible(eligibility.getIsEligible())
                .requiredClassesToBecomeEligible(eligibility.getRequiredClassesToBecomeEligible())
                .build();
    }

    @Override
    public AdminDepartmentReportDto getAdminDepartmentReport(UUID departmentId, UUID academicYearId, UUID semesterId) {
        String deptName = departmentRepository.findById(departmentId).map(d -> d.getName()).orElse("Unknown Department");

        List<Object[]> classSummary = studentAttendanceRepository.getDepartmentClassAttendanceSummary(departmentId, academicYearId, semesterId);
        
        int deptTotalStudents = 0;
        int deptTotalPresent = 0;
        int deptTotalRecords = 0;
        
        List<ClassAttendanceReportDto> classComparisons = new ArrayList<>();
        
        for (Object[] row : classSummary) {
            UUID classId = (UUID) row[0];
            String className = (String) row[1];
            int totalStudents = ((Number) row[2]).intValue();
            int totalRecords = ((Number) row[3]).intValue();
            int totalPresent = ((Number) row[4]).intValue();
            
            deptTotalStudents += totalStudents;
            deptTotalRecords += totalRecords;
            deptTotalPresent += totalPresent;
            
            double classAvg = totalRecords == 0 ? 0.0 : (double) totalPresent / totalRecords * 100.0;
            
            // For students below threshold, we'd normally query, but to keep the payload clean we can leave it empty or just populate from a sub-query.
            classComparisons.add(ClassAttendanceReportDto.builder()
                    .classId(classId)
                    .className(className)
                    .totalStudents(totalStudents)
                    .averageAttendancePercentage(classAvg)
                    .studentEligibility(new ArrayList<>())
                    .build());
        }
        
        double deptAvg = deptTotalRecords == 0 ? 0.0 : (double) deptTotalPresent / deptTotalRecords * 100.0;
        
        return AdminDepartmentReportDto.builder()
                .departmentName(deptName)
                .overallAttendancePercentage(deptAvg)
                .totalStudents(deptTotalStudents)
                .classComparisons(classComparisons)
                .studentsBelowThreshold(new ArrayList<>()) // Can be populated if needed
                .build();
    }

    @Override
    public com.acronexus.dto.ai.AiInsightDto predictAttendanceShortage(UUID classId) {
        List<Object[]> summary = studentAttendanceRepository.getClassStudentAttendanceSummary(classId);
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("ATTENDANCE_PREDICTION")
                .contextType("attendance-shortage-prediction")
                .contextId(classId.toString())
                .data(java.util.Map.of(
                        "students", summary.stream().map(row -> java.util.Map.of(
                                "id", row[0],
                                "totalClasses", row[4],
                                "presentClasses", row[5]
                        )).collect(Collectors.toList())
                ))
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    public com.acronexus.dto.ai.AiInsightDto detectFacultyAnomalies(UUID facultyId, LocalDate startDate, LocalDate endDate) {
        FacultyReportDto report = getFacultyReport(facultyId, startDate, endDate);
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("ATTENDANCE_ANOMALY")
                .contextType("faculty-attendance-anomalies")
                .contextId(facultyId.toString())
                .data(java.util.Map.of(
                        "totalSessions", report.getTotalSessions(),
                        "averageAttendancePercentage", report.getAverageAttendancePercentage(),
                        "totalAbsentees", report.getTotalAbsentees()
                ))
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    public com.acronexus.dto.ai.AiInsightDto generateParentNotificationSuggestions(UUID studentId, UUID academicYearId, UUID semesterId) {
        StudentReportDto report = getStudentReport(studentId, academicYearId, semesterId);
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("ATTENDANCE_PARENT_NOTIFICATION")
                .contextType("parent-notification-suggestions")
                .contextId(studentId.toString())
                .data(java.util.Map.of(
                        "overallAttendancePercentage", report.getOverallAttendancePercentage(),
                        "isEligible", report.getIsEligible(),
                        "requiredClassesToBecomeEligible", report.getRequiredClassesToBecomeEligible()
                ))
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    public com.acronexus.dto.ai.AiInsightDto generateAutomaticWarnings(UUID departmentId, UUID academicYearId, UUID semesterId) {
        AdminDepartmentReportDto report = getAdminDepartmentReport(departmentId, academicYearId, semesterId);
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("ATTENDANCE_AUTOMATIC_WARNINGS")
                .contextType("automatic-warnings")
                .contextId(departmentId.toString())
                .data(java.util.Map.of(
                        "overallAttendancePercentage", report.getOverallAttendancePercentage(),
                        "classComparisons", report.getClassComparisons()
                ))
                .build();
                
        return aiService.getInsights(request);
    }

}
