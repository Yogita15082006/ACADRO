package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.AttendanceReportDto.*;
import com.acronexus.service.AttendanceReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.acronexus.security.UserDetailsImpl;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance-reports")
@RequiredArgsConstructor
public class AttendanceReportController {

    private final AttendanceReportService attendanceReportService;

    // --- AUTHORIZATION HELPERS ---
    private void verifyStudentAccess(UUID studentId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !userDetails.getId().equals(studentId)) {
            throw new AccessDeniedException("Access denied: You can only access your own report");
        }
    }

    private void verifyFacultyAccess(UUID facultyId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HOD"));
        if (!isAdmin && !userDetails.getId().equals(facultyId)) {
            throw new AccessDeniedException("Access denied: You can only access your own report");
        }
    }

    // --- ENDPOINTS ---

    @GetMapping("/class/{classId}/eligibility")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EligibilityReportDto>>> getClassEligibilityReport(
            @PathVariable UUID classId,
            @RequestParam(defaultValue = "75.0") Double threshold) {
        
        return ResponseEntity.ok(ApiResponse.success(
                "Class eligibility report generated successfully",
                attendanceReportService.getClassEligibilityReport(classId, threshold)
        ));
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyReportDto>> getFacultyReport(
            @PathVariable UUID facultyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        verifyFacultyAccess(facultyId);

        return ResponseEntity.ok(ApiResponse.success(
                "Faculty report generated successfully",
                attendanceReportService.getFacultyReport(facultyId, startDate, endDate)
        ));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<StudentReportDto>> getStudentReport(
            @PathVariable UUID studentId,
            @RequestParam(required = false) UUID academicYearId,
            @RequestParam(required = false) UUID semesterId) {
        
        verifyStudentAccess(studentId);

        return ResponseEntity.ok(ApiResponse.success(
                "Student report generated successfully",
                attendanceReportService.getStudentReport(studentId, academicYearId, semesterId)
        ));
    }

    @GetMapping("/admin/department/{departmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<AdminDepartmentReportDto>> getAdminDepartmentReport(
            @PathVariable UUID departmentId,
            @RequestParam UUID academicYearId,
            @RequestParam UUID semesterId) {
        
        return ResponseEntity.ok(ApiResponse.success(
                "Admin department report generated successfully",
                attendanceReportService.getAdminDepartmentReport(departmentId, academicYearId, semesterId)
        ));
    }

    @GetMapping("/class/{classId}/shortage-prediction")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.ai.AiInsightDto>> predictAttendanceShortage(
            @PathVariable UUID classId) {
        
        return ResponseEntity.ok(ApiResponse.success(
                "Attendance shortage prediction generated successfully",
                attendanceReportService.predictAttendanceShortage(classId)
        ));
    }

    @GetMapping("/faculty/{facultyId}/anomalies")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.ai.AiInsightDto>> detectFacultyAnomalies(
            @PathVariable UUID facultyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        verifyFacultyAccess(facultyId);

        return ResponseEntity.ok(ApiResponse.success(
                "Faculty attendance anomalies detected successfully",
                attendanceReportService.detectFacultyAnomalies(facultyId, startDate, endDate)
        ));
    }

    @GetMapping("/student/{studentId}/parent-notification-suggestions")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.ai.AiInsightDto>> generateParentNotificationSuggestions(
            @PathVariable UUID studentId,
            @RequestParam UUID academicYearId,
            @RequestParam UUID semesterId) {
        
        verifyStudentAccess(studentId);

        return ResponseEntity.ok(ApiResponse.success(
                "Parent notification suggestions generated successfully",
                attendanceReportService.generateParentNotificationSuggestions(studentId, academicYearId, semesterId)
        ));
    }

    @GetMapping("/admin/department/{departmentId}/automatic-warnings")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.ai.AiInsightDto>> generateAutomaticWarnings(
            @PathVariable UUID departmentId,
            @RequestParam UUID academicYearId,
            @RequestParam UUID semesterId) {
        
        return ResponseEntity.ok(ApiResponse.success(
                "Automatic warnings generated successfully",
                attendanceReportService.generateAutomaticWarnings(departmentId, academicYearId, semesterId)
        ));
    }

}
