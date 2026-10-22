package com.acronexus.controller;

import com.acronexus.entity.AcademicYear;
import com.acronexus.repository.AcademicYearRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.stream.Collectors;

import java.util.List;
import com.acronexus.dto.ApiResponse;

@RestController
@RequestMapping({"/api/academic-years", "/api/v1/academic-years"})
@RequiredArgsConstructor
public class AcademicYearController {

    private final AcademicYearRepository academicYearRepository;
    private final com.acronexus.repository.StudentEnrollmentRepository studentEnrollmentRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<AcademicYear>>> getAllAcademicYears(@RequestParam(required = false) String batch) {
        List<AcademicYear> activeYears;
        if (batch != null && !batch.trim().isEmpty()) {
            activeYears = studentEnrollmentRepository.findDistinctAcademicYears(batch.trim());
        } else {
            activeYears = academicYearRepository.findAll();
            if (activeYears == null || activeYears.isEmpty()) {
                activeYears = studentEnrollmentRepository.findDistinctAcademicYears(null);
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Academic years retrieved successfully", activeYears));
    }
}
