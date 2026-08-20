package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.response.AdminDashboardResponse;
import com.acronexus.dto.response.FacultyDashboardResponse;
import com.acronexus.dto.response.HodDashboardResponse;
import com.acronexus.dto.response.StudentDashboardResponse;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentDashboardResponse>> getStudentDashboard(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        StudentDashboardResponse dashboard = dashboardService.getStudentDashboard(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Student dashboard loaded", dashboard));
    }

    @GetMapping("/faculty")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<FacultyDashboardResponse>> getFacultyDashboard(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        FacultyDashboardResponse dashboard = dashboardService.getFacultyDashboard(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Faculty dashboard loaded", dashboard));
    }

    @GetMapping("/coordinator")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'HOD')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.response.CoordinatorDashboardResponse>> getCoordinatorDashboard(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        com.acronexus.dto.response.CoordinatorDashboardResponse dashboard = dashboardService.getCoordinatorDashboard(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Coordinator dashboard loaded", dashboard));
    }

    @GetMapping("/hod")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<HodDashboardResponse>> getHodDashboard(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        HodDashboardResponse dashboard = dashboardService.getHodDashboard(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("HOD dashboard loaded", dashboard));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        AdminDashboardResponse dashboard = dashboardService.getAdminDashboard();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard loaded", dashboard));
    }
}
