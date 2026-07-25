package com.acronexus.service;

import com.acronexus.dto.AttendanceReportDto.*;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

public interface AttendanceReportService {
    
    // Eligibility
    List<EligibilityReportDto> getClassEligibilityReport(UUID classId, Double threshold);

    // Faculty Reports
    FacultyReportDto getFacultyReport(UUID facultyId, LocalDate startDate, LocalDate endDate);

    // Student Reports
    StudentReportDto getStudentReport(UUID studentId, UUID academicYearId, UUID semesterId);

    // Admin Reports
    AdminDepartmentReportDto getAdminDepartmentReport(UUID departmentId, UUID academicYearId, UUID semesterId);
    
    // AI Insights
    com.acronexus.dto.ai.AiInsightDto predictAttendanceShortage(UUID classId);
    com.acronexus.dto.ai.AiInsightDto detectFacultyAnomalies(UUID facultyId, LocalDate startDate, LocalDate endDate);
    com.acronexus.dto.ai.AiInsightDto generateParentNotificationSuggestions(UUID studentId, UUID academicYearId, UUID semesterId);
    com.acronexus.dto.ai.AiInsightDto generateAutomaticWarnings(UUID departmentId, UUID academicYearId, UUID semesterId);

}
