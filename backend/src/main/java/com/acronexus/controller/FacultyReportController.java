package com.acronexus.controller;

import com.acronexus.dto.FacultyReportDto;
import com.acronexus.service.FacultyReportService;
import com.acronexus.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/faculty-reports")
@RequiredArgsConstructor
public class FacultyReportController {

    private final FacultyReportService facultyReportService;

    @GetMapping("/{facultyId}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<FacultyReportDto> getFacultyReport(
            @PathVariable UUID facultyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(facultyReportService.getFacultyReport(facultyId, currentUser.getId()));
    }

    @GetMapping("/consolidated")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<com.acronexus.dto.FacultyConsolidatedReportDto> getConsolidatedFacultyReport(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(facultyReportService.getConsolidatedFacultyReport(currentUser.getId()));
    }
}
