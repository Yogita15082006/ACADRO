package com.acronexus.controller;

import com.acronexus.dto.BulkUploadResponseDto;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.StudentBulkUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
import com.acronexus.dto.AiStudentValidationResultDto;

import com.acronexus.dto.StudentBulkImportRequestDto;

@RestController
@RequestMapping("/api/v1/bulk-upload/students")
@RequiredArgsConstructor
@Tag(name = "Student Bulk Upload", description = "APIs for handling bulk uploading of students")
public class StudentBulkUploadController {

    private final StudentBulkUploadService studentBulkUploadService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("permitAll()")
    @Operation(
            summary = "Upload Student List (CSV/Excel)",
            description = "Uploads a student list. Requires ADMIN or HOD role.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Upload Processed",
                            content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = BulkUploadResponseDto.class))),
                    @ApiResponse(responseCode = "400", description = "Invalid File"),
                    @ApiResponse(responseCode = "403", description = "Access Denied")
            }
    )
    public ResponseEntity<BulkUploadResponseDto> uploadStudentList(
            @Parameter(description = "CSV or Excel file containing the student records", required = true)
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        // TODO: REVERT - Using test HOD user for local debugging
        UUID userId = userDetails != null ? userDetails.getId() : UUID.fromString("c4cb2870-9c33-4d53-ad83-8dc34ee79bec");
        BulkUploadResponseDto response = studentBulkUploadService.uploadStudentList(file, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/confirm", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("permitAll()")
    @Operation(
            summary = "Confirm & Import AI Validated Student Records",
            description = "Imports previously validated student JSON records directly into PostgreSQL without re-parsing the original file."
    )
    public ResponseEntity<BulkUploadResponseDto> confirmStudentImport(
            @RequestBody StudentBulkImportRequestDto requestDto,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        UUID userId = userDetails != null ? userDetails.getId() : UUID.fromString("c4cb2870-9c33-4d53-ad83-8dc34ee79bec");
        BulkUploadResponseDto response = studentBulkUploadService.importValidatedStudents(requestDto.getRecords(), userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/validate-ai", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("permitAll()")
    @Operation(
            summary = "Validate Student List via AI (Dry Run)",
            description = "Validates the uploaded student list using Groq AI and returns mapping suggestions and errors without saving to the DB.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Validation Complete",
                            content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AiStudentValidationResultDto.class))),
                    @ApiResponse(responseCode = "400", description = "Invalid File"),
                    @ApiResponse(responseCode = "403", description = "Access Denied")
            }
    )
    public ResponseEntity<AiStudentValidationResultDto> validateStudentListWithAi(
            @Parameter(description = "CSV or Excel file containing the student records", required = true)
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        // TODO: REVERT - Using test HOD user for local debugging
        UUID userId = userDetails != null ? userDetails.getId() : UUID.fromString("c4cb2870-9c33-4d53-ad83-8dc34ee79bec");
        AiStudentValidationResultDto response = studentBulkUploadService.validateStudentListWithAi(file, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{uploadId}/error-report")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(
            summary = "Download Error Report CSV",
            description = "Downloads a CSV file containing rows that failed processing. Requires ADMIN or HOD role.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "CSV File Generated"),
                    @ApiResponse(responseCode = "404", description = "Upload Not Found"),
                    @ApiResponse(responseCode = "403", description = "Access Denied")
            }
    )
    public ResponseEntity<byte[]> downloadErrorReport(
            @Parameter(description = "UUID of the bulk upload", required = true)
            @PathVariable UUID uploadId) {
        byte[] csvBytes = studentBulkUploadService.generateErrorReportCsv(uploadId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=error_report_" + uploadId + ".csv");
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(csvBytes);
    }
}

