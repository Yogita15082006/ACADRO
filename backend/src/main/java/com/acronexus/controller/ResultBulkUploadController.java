package com.acronexus.controller;

import com.acronexus.dto.BulkUploadResponseDto;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.ResultBulkUploadService;
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
import com.acronexus.repository.SubjectRepository;
import com.acronexus.repository.BulkUploadRepository;

@RestController
@RequestMapping("/api/v1/bulk-upload/results")
@RequiredArgsConstructor
@Tag(name = "Result Bulk Upload", description = "APIs for handling bulk uploading of exam results")
public class ResultBulkUploadController {

    private final ResultBulkUploadService resultBulkUploadService;
    private final SubjectRepository subjectRepository;
    private final BulkUploadRepository bulkUploadRepository;

    @GetMapping("/debug")
    public ResponseEntity<java.util.Map<String, Object>> getDebugInfo() {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("subjects", subjectRepository.findAll());
        var uploads = bulkUploadRepository.findAll();
        if (!uploads.isEmpty()) {
            map.put("last_upload", uploads.get(uploads.size() - 1));
        }
        return ResponseEntity.ok(map);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    @Operation(
            summary = "Upload Exam Results List (CSV/Excel)",
            description = "Uploads an exam results list. Requires ADMIN, HOD, or COORDINATOR role.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Upload Processed",
                            content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = BulkUploadResponseDto.class))),
                    @ApiResponse(responseCode = "400", description = "Invalid File"),
                    @ApiResponse(responseCode = "403", description = "Access Denied")
            }
    )
    public ResponseEntity<BulkUploadResponseDto> uploadResultList(
            @Parameter(description = "CSV or Excel file containing the exam result records", required = true)
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "examinationId", required = false) UUID examinationId,
            @RequestParam(value = "className", required = false) String className,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        BulkUploadResponseDto response = resultBulkUploadService.uploadResultList(file, userDetails.getId(), examinationId, className);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{uploadId}/error-report")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    @Operation(
            summary = "Download Error Report CSV",
            description = "Downloads a CSV file containing rows that failed processing. Requires ADMIN, HOD, or COORDINATOR role.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "CSV File Generated"),
                    @ApiResponse(responseCode = "404", description = "Upload Not Found"),
                    @ApiResponse(responseCode = "403", description = "Access Denied")
            }
    )
    public ResponseEntity<byte[]> downloadErrorReport(
            @Parameter(description = "UUID of the bulk upload", required = true)
            @PathVariable UUID uploadId) {
        byte[] csvBytes = resultBulkUploadService.generateErrorReportCsv(uploadId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=error_report_" + uploadId + ".csv");
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(csvBytes);
    }
}
