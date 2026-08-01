package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.SubjectResourceUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subject-resources")
@RequiredArgsConstructor
@Tag(name = "Subject Resource Upload", description = "APIs for uploading and managing Scheme and Syllabus versions")
public class SubjectResourceUploadController {

    private final SubjectResourceUploadService subjectResourceUploadService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Upload Scheme or Syllabus File", description = "Uploads a PDF file. Requires ADMIN or HOD role.")
    public ResponseEntity<ApiResponse<?>> uploadResource(
            @Parameter(description = "Scheme or Syllabus PDF file", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Department ID", required = true)
            @RequestParam("departmentId") UUID departmentId,
            @Parameter(description = "Academic Year ID", required = true)
            @RequestParam("academicYearId") UUID academicYearId,
            @Parameter(description = "Semester ID", required = true)
            @RequestParam("semesterId") UUID semesterId,
            @Parameter(description = "Subject ID", required = true)
            @RequestParam("subjectId") UUID subjectId,
            @Parameter(description = "Resource Type (SCHEME or SYLLABUS)", required = true)
            @RequestParam("resourceType") String resourceType,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        ApiResponse<?> response = subjectResourceUploadService.uploadResource(
                file, departmentId, academicYearId, semesterId, subjectId, resourceType, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    @Operation(summary = "Get Version History", description = "Retrieves version history for a specific Subject Resource")
    public ResponseEntity<ApiResponse<?>> getVersionHistory(
            @RequestParam("subjectId") UUID subjectId,
            @RequestParam("academicYearId") UUID academicYearId,
            @RequestParam("semesterId") UUID semesterId,
            @RequestParam("resourceType") String resourceType) {
        
        return ResponseEntity.ok(subjectResourceUploadService.getVersionHistory(subjectId, academicYearId, semesterId, resourceType));
    }

    @GetMapping("/{versionId}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT')")
    @Operation(summary = "Download a specific version", description = "Downloads the PDF file for a specific version")
    public ResponseEntity<byte[]> downloadVersion(@PathVariable UUID versionId) {
        byte[] fileBytes = subjectResourceUploadService.downloadVersion(versionId);
        String fileName = subjectResourceUploadService.getFileName(versionId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");
        String mimeType = "application/pdf";
        if (fileName != null) {
            String lower = fileName.toLowerCase();
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                mimeType = "image/jpeg";
            } else if (lower.endsWith(".png")) {
                mimeType = "image/png";
            } else if (lower.endsWith(".csv")) {
                mimeType = "text/csv";
            } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
                mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            }
        }
        headers.setContentType(MediaType.parseMediaType(mimeType));
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(fileBytes);
    }

    @PutMapping("/{versionId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Set Active Version", description = "Sets the specified version as active, deactivating others")
    public ResponseEntity<ApiResponse<?>> setActiveVersion(@PathVariable UUID versionId) {
        return ResponseEntity.ok(subjectResourceUploadService.setActiveVersion(versionId));
    }

    @DeleteMapping("/{versionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Delete Version", description = "Soft deletes a specific version (cannot be the active version)")
    public ResponseEntity<ApiResponse<?>> softDeleteVersion(@PathVariable UUID versionId) {
        return ResponseEntity.ok(subjectResourceUploadService.softDeleteVersion(versionId));
    }
}
