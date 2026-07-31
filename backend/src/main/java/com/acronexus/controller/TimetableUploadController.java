package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.TimetableUploadService;
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
@RequestMapping("/api/v1/timetables")
@RequiredArgsConstructor
@Tag(name = "Timetable Upload", description = "APIs for uploading and managing Timetable versions")
public class TimetableUploadController {

    private final TimetableUploadService timetableUploadService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Upload Timetable File", description = "Uploads a PDF or Image file (JPG/PNG). Requires ADMIN or HOD role.")
    public ResponseEntity<ApiResponse<?>> uploadTimetable(
            @Parameter(description = "Timetable PDF file", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Department Name", required = true)
            @RequestParam("departmentName") String departmentName,
            @Parameter(description = "Academic Year", required = true)
            @RequestParam("academicYear") String academicYear,
            @Parameter(description = "Semester Name", required = true)
            @RequestParam("semesterName") String semesterName,
            @Parameter(description = "Class Name", required = true)
            @RequestParam("className") String className,
            @Parameter(description = "Batch Name", required = false)
            @RequestParam(value = "batchName", required = false) String batchName,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        ApiResponse<?> response = timetableUploadService.uploadTimetable(
                file, departmentName, academicYear, semesterName, className, batchName, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{versionId}/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Replace Timetable File", description = "Replaces a timetable file by soft deleting the old version and creating a new one.")
    public ResponseEntity<ApiResponse<?>> replaceTimetable(
            @PathVariable UUID versionId,
            @Parameter(description = "Timetable PDF file", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Department Name", required = true)
            @RequestParam("departmentName") String departmentName,
            @Parameter(description = "Academic Year", required = true)
            @RequestParam("academicYear") String academicYear,
            @Parameter(description = "Semester Name", required = true)
            @RequestParam("semesterName") String semesterName,
            @Parameter(description = "Class Name", required = true)
            @RequestParam("className") String className,
            @Parameter(description = "Batch Name", required = false)
            @RequestParam(value = "batchName", required = false) String batchName,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // First soft delete the old version
        timetableUploadService.softDeleteVersion(versionId);
        
        // Then upload the new version
        ApiResponse<?> response = timetableUploadService.uploadTimetable(
                file, departmentName, academicYear, semesterName, className, batchName, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'COORDINATOR')")
    @Operation(summary = "Get All Timetables", description = "Retrieves all timetables")
    public ResponseEntity<ApiResponse<?>> getAllTimetables() {
        return ResponseEntity.ok(timetableUploadService.getAllTimetables());
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'COORDINATOR')")
    @Operation(summary = "Get Version History", description = "Retrieves version history for a specific Timetable")
    public ResponseEntity<ApiResponse<?>> getVersionHistory(
            @RequestParam("classId") UUID classId,
            @RequestParam("academicYearId") UUID academicYearId,
            @RequestParam("semesterId") UUID semesterId) {
        
        return ResponseEntity.ok(timetableUploadService.getVersionHistory(classId, academicYearId, semesterId));
    }

    @GetMapping("/{versionId}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT')")
    @Operation(summary = "Download a specific version", description = "Downloads the file for a specific version")
    public ResponseEntity<byte[]> downloadVersion(@PathVariable UUID versionId) {
        byte[] fileBytes = timetableUploadService.downloadVersion(versionId);
        String fileName = timetableUploadService.getFileName(versionId);
        String mimeType = timetableUploadService.getFileMimeType(versionId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");
        headers.setContentType(MediaType.parseMediaType(mimeType));
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(fileBytes);
    }

    @PutMapping("/{versionId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Set Active Version", description = "Sets the specified version as active, deactivating others")
    public ResponseEntity<ApiResponse<?>> setActiveVersion(@PathVariable UUID versionId) {
        return ResponseEntity.ok(timetableUploadService.setActiveVersion(versionId));
    }

    @DeleteMapping("/{versionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Delete Version", description = "Soft deletes a specific version (cannot be the active version)")
    public ResponseEntity<ApiResponse<?>> softDeleteVersion(@PathVariable UUID versionId) {
        return ResponseEntity.ok(timetableUploadService.softDeleteVersion(versionId));
    }
}
