package com.acronexus.controller;

import com.acronexus.entity.Semester;
import com.acronexus.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import com.acronexus.dto.ApiResponse;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterRepository semesterRepository;
    private final com.acronexus.repository.StudentEnrollmentRepository studentEnrollmentRepository;
    private final com.acronexus.repository.AcademicYearRepository academicYearRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<Semester>>> getSemesters(
            @RequestParam(required = false) UUID academicYearId,
            @RequestParam(required = false) String batch) {
        
        List<Semester> semesters = semesterRepository.findAll();
        
        if (batch != null && !batch.isEmpty() && academicYearId != null) {
            com.acronexus.entity.AcademicYear year = academicYearRepository.findById(academicYearId).orElse(null);
            if (year != null) {
                List<Integer> rawSemNumbers = studentEnrollmentRepository.findDistinctSemesters(batch, java.util.List.of(year.getYear()));
                List<Integer> validSemNumbers = rawSemNumbers.stream().map(Number::intValue).collect(Collectors.toList());
                
                if (validSemNumbers.isEmpty()) {
                    try {
                        int batchStartYear = Integer.parseInt(batch.split("-")[0]);
                        int acadStartYear = Integer.parseInt(year.getYear().split("-")[0]);
                        int yearOfStudy = acadStartYear - batchStartYear + 1;
                        if (yearOfStudy > 0 && yearOfStudy <= 5) {
                            validSemNumbers.add(yearOfStudy * 2 - 1);
                            validSemNumbers.add(yearOfStudy * 2);
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                }
                
                semesters = semesters.stream()
                    .filter(s -> validSemNumbers.contains(s.getSemesterNumber() != null ? s.getSemesterNumber().intValue() : -1))
                    .collect(Collectors.toList());
            } else {
                semesters = java.util.Collections.emptyList();
            }
        } else if (academicYearId != null) {
            semesters = semesters.stream()
                .filter(s -> s.getAcademicYear() != null && s.getAcademicYear().getId().equals(academicYearId))
                .collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(ApiResponse.success("Semesters retrieved successfully", semesters));
    }
}
