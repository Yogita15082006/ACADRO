package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.MetadataDto;
import com.acronexus.service.MetadataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/metadata")
@RequiredArgsConstructor
public class MetadataController {

    private final MetadataService metadataService;

    @GetMapping
    public ResponseEntity<ApiResponse<MetadataDto>> getAllMetadata() {
        return ResponseEntity.ok(ApiResponse.success("Metadata retrieved successfully", metadataService.getAllMetadata()));
    }

    @GetMapping("/classes")
    public ResponseEntity<ApiResponse<List<String>>> getClasses(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String batch,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String semester) {
        if (batch != null && !batch.isEmpty()) {
            if (semester != null && !semester.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success("Classes retrieved successfully", metadataService.getClassesBySemester(batch, semester)));
            }
            return ResponseEntity.ok(ApiResponse.success("Classes retrieved successfully", metadataService.getClassesByBatch(batch)));
        }
        return ResponseEntity.ok(ApiResponse.success("Classes retrieved successfully", metadataService.getClasses()));
    }

    @GetMapping("/batches")
    public ResponseEntity<ApiResponse<List<String>>> getBatches() {
        return ResponseEntity.ok(ApiResponse.success("Batches retrieved successfully", metadataService.getBatches()));
    }

    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<String>>> getDepartments() {
        return ResponseEntity.ok(ApiResponse.success("Departments retrieved successfully", metadataService.getDepartments()));
    }

    @GetMapping("/degrees")
    public ResponseEntity<ApiResponse<List<String>>> getDegrees() {
        return ResponseEntity.ok(ApiResponse.success("Degrees retrieved successfully", metadataService.getDegrees()));
    }

    @GetMapping("/academic-years")
    public ResponseEntity<ApiResponse<List<String>>> getAcademicYears(@org.springframework.web.bind.annotation.RequestParam(required = false) String batch) {
        if (batch != null && !batch.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success("Academic years retrieved successfully", metadataService.getAcademicYearsByBatch(batch)));
        }
        return ResponseEntity.ok(ApiResponse.success("Academic years retrieved successfully", metadataService.getAcademicYears()));
    }

    @GetMapping("/semesters")
    public ResponseEntity<ApiResponse<List<String>>> getSemesters(@org.springframework.web.bind.annotation.RequestParam(required = false) String year) {
        if (year != null && !year.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success("Semesters retrieved successfully", metadataService.getSemestersByYear(year)));
        }
        return ResponseEntity.ok(ApiResponse.success("Semesters retrieved successfully", metadataService.getSemesters()));
    }

    @GetMapping("/statuses")
    public ResponseEntity<ApiResponse<List<String>>> getStatuses() {
        return ResponseEntity.ok(ApiResponse.success("Statuses retrieved successfully", metadataService.getStatuses()));
    }

    @GetMapping("/subjects")
    public ResponseEntity<ApiResponse<List<String>>> getSubjects() {
        return ResponseEntity.ok(ApiResponse.success("Subjects retrieved successfully", metadataService.getSubjects()));
    }

    @GetMapping("/sections")
    public ResponseEntity<ApiResponse<List<String>>> getSections() {
        return ResponseEntity.ok(ApiResponse.success("Sections retrieved successfully", metadataService.getSections()));
    }

    @GetMapping("/designations")
    public ResponseEntity<ApiResponse<List<String>>> getDesignations() {
        return ResponseEntity.ok(ApiResponse.success("Designations retrieved successfully", metadataService.getDesignations()));
    }
}
