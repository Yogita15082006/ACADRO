package com.acronexus.controller;

import com.acronexus.dto.BulkUploadResponseDto;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.FacultyBulkUploadService;
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
import java.util.List;
import java.util.Map;
import com.acronexus.dto.AiFacultyValidationResultDto;

@RestController
@RequestMapping("/api/v1/bulk-upload/faculties")
@RequiredArgsConstructor
@Tag(name = "Faculty Bulk Upload", description = "APIs for handling bulk uploading of faculties")
public class FacultyBulkUploadController {

    private final FacultyBulkUploadService facultyBulkUploadService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(
            summary = "Upload Faculty List (CSV/Excel)",
            description = "Uploads a faculty list. Requires ADMIN or HOD role.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Upload Processed",
                            content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = BulkUploadResponseDto.class))),
                    @ApiResponse(responseCode = "400", description = "Invalid File"),
                    @ApiResponse(responseCode = "403", description = "Access Denied")
            }
    )
    public ResponseEntity<BulkUploadResponseDto> uploadFacultyList(
            @Parameter(description = "CSV or Excel file containing the faculty records", required = true)
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        BulkUploadResponseDto response = facultyBulkUploadService.uploadFacultyList(file, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/confirm", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("permitAll()")
    @Operation(
            summary = "Confirm Faculty Upload",
            description = "Saves the AI-validated faculty records to the database.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Import Processed",
                            content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = BulkUploadResponseDto.class))),
                    @ApiResponse(responseCode = "400", description = "Invalid Payload"),
                    @ApiResponse(responseCode = "403", description = "Access Denied")
            }
    )
    public ResponseEntity<BulkUploadResponseDto> confirmFacultyUpload(
            @RequestBody Map<String, Object> requestBody,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        List<Map<String, Object>> records = (List<Map<String, Object>>) requestBody.get("records");
        UUID userId = userDetails != null ? userDetails.getId() : java.util.UUID.fromString("c4cb2870-9c33-4d53-ad83-8dc34ee79bec");
        BulkUploadResponseDto response = facultyBulkUploadService.importValidatedFaculties(records, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/validate-ai", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("permitAll()")
    @Operation(
            summary = "Validate Faculty List via AI (Dry Run)",
            description = "Validates the uploaded faculty list using Groq AI and returns mapping suggestions and errors without saving to the DB.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Validation Complete",
                            content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AiFacultyValidationResultDto.class))),
                    @ApiResponse(responseCode = "400", description = "Invalid File"),
                    @ApiResponse(responseCode = "403", description = "Access Denied")
            }
    )
    public ResponseEntity<AiFacultyValidationResultDto> validateFacultyListWithAi(
            @Parameter(description = "CSV or Excel file containing the faculty records", required = true)
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        java.util.UUID userId = userDetails != null ? userDetails.getId() : java.util.UUID.fromString("c4cb2870-9c33-4d53-ad83-8dc34ee79bec");
        AiFacultyValidationResultDto response = facultyBulkUploadService.validateFacultyListWithAi(file, userId);
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
        byte[] csvBytes = facultyBulkUploadService.generateErrorReportCsv(uploadId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=faculty_error_report_" + uploadId + ".csv");
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(csvBytes);
    }
}
