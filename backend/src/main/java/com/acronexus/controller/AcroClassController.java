package com.acronexus.controller;

import com.acronexus.entity.AcroClass;
import com.acronexus.repository.AcroClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.UUID;

import java.util.List;

import com.acronexus.dto.ApiResponse;

@RestController
@RequestMapping("/api/v1/classes")
@RequiredArgsConstructor
public class AcroClassController {

    private final AcroClassRepository acroClassRepository;
    private final com.acronexus.repository.StudentEnrollmentRepository studentEnrollmentRepository;
    private final com.acronexus.repository.AcademicYearRepository academicYearRepository;
    private final com.acronexus.repository.SemesterRepository semesterRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<AcroClass>>> getAllClasses(
            @RequestParam(required = false) String batch,
            @RequestParam(required = false) UUID academicYearId,
            @RequestParam(required = false) UUID semesterId) {
        
        if (batch != null && !batch.isEmpty() && academicYearId != null && semesterId != null) {
            com.acronexus.entity.AcademicYear year = academicYearRepository.findById(academicYearId).orElse(null);
            com.acronexus.entity.Semester sem = semesterRepository.findById(semesterId).orElse(null);
            
            if (year != null && sem != null) {
                List<AcroClass> classes = studentEnrollmentRepository.findClasses(batch, java.util.List.of(year.getYear()), String.valueOf(sem.getSemesterNumber()));
                return ResponseEntity.ok(ApiResponse.success("Classes retrieved successfully", classes));
            } else {
                return ResponseEntity.ok(ApiResponse.success("Classes retrieved successfully", java.util.Collections.emptyList()));
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success("Classes retrieved successfully", acroClassRepository.findAll()));
    }
}
