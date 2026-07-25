package com.acronexus.controller;

import com.acronexus.entity.AcroClass;
import com.acronexus.repository.AcroClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.acronexus.dto.ApiResponse;

@RestController
@RequestMapping("/api/v1/classes")
@RequiredArgsConstructor
public class AcroClassController {

    private final AcroClassRepository acroClassRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<AcroClass>>> getAllClasses() {
        return ResponseEntity.ok(ApiResponse.success("Classes retrieved successfully", acroClassRepository.findAll()));
    }
}
