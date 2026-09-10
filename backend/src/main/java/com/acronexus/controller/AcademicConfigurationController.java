package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.service.AcademicConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/academic-configuration")
@RequiredArgsConstructor
public class AcademicConfigurationController {

    private final AcademicConfigurationService academicConfigurationService;

    @PostMapping("/academic-years/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<Void>> activateAcademicYear(@PathVariable UUID id) {
        academicConfigurationService.activateAcademicYear(id);
        return ResponseEntity.ok(ApiResponse.success("Academic Year activated successfully", null));
    }

    @PostMapping("/semesters/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<Void>> activateSemester(@PathVariable UUID id) {
        academicConfigurationService.activateSemester(id);
        return ResponseEntity.ok(ApiResponse.success("Semester activated successfully", null));
    }
}
