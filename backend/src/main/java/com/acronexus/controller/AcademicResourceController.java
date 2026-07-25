package com.acronexus.controller;

import com.acronexus.dto.AcademicResourceDto;
import com.acronexus.dto.ApiResponse;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.AcademicResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/academic-resources")
@RequiredArgsConstructor
@Tag(name = "Academic Resources", description = "APIs for global Scheme and Syllabus uploads")
public class AcademicResourceController {

    private final AcademicResourceService service;

    @PostMapping(value = "/scheme", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Upload Academic Scheme", description = "Uploads a Scheme PDF file. Requires ADMIN or HOD role.")
    public ResponseEntity<ApiResponse<AcademicResourceDto>> uploadScheme(
            @Parameter(description = "Scheme PDF file", required = true)
            @RequestParam("file") MultipartFile file,
            @RequestParam("academicYear") String academicYear,
            @RequestParam("batch") String batch,
            @RequestParam("className") String className,
            @RequestParam("semester") String semester,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        return ResponseEntity.ok(service.uploadScheme(file, academicYear, batch, className, semester, userDetails.getId()));
    }

    @PostMapping(value = "/syllabus", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Upload Academic Syllabus", description = "Uploads a Syllabus PDF file. Requires ADMIN or HOD role.")
    public ResponseEntity<ApiResponse<AcademicResourceDto>> uploadSyllabus(
            @Parameter(description = "Syllabus PDF file", required = true)
            @RequestParam("file") MultipartFile file,
            @RequestParam("academicYear") String academicYear,
            @RequestParam(value = "batch", required = false) String batch,
            @RequestParam(value = "className", required = false) String className,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "degree", required = false) String degree,
            @RequestParam("semester") String semester,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        return ResponseEntity.ok(service.uploadSyllabus(file, academicYear, batch, className, department, degree, semester, userDetails.getId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT')")
    @Operation(summary = "Get All Academic Resources", description = "Retrieves all Scheme and Syllabus documents")
    public ResponseEntity<ApiResponse<List<AcademicResourceDto>>> getAllResources() {
        return ResponseEntity.ok(ApiResponse.success("Academic resources retrieved", service.getAllResources()));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT')")
    @Operation(summary = "Download Academic Resource", description = "Downloads a Scheme or Syllabus document")
    public ResponseEntity<byte[]> downloadResource(@PathVariable UUID id) {
        byte[] fileBytes = service.downloadResource(id);
        String fileName = service.getFileName(id);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");
        headers.setContentType(MediaType.APPLICATION_PDF);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(fileBytes);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Delete Academic Resource", description = "Deletes a Scheme or Syllabus document")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable UUID id) {
        service.deleteResource(id);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted successfully", null));
    }
}
