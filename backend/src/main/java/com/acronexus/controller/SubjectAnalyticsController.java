package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.SubjectAnalyticsDTO;
import com.acronexus.service.SubjectAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class SubjectAnalyticsController {

    private final SubjectAnalyticsService subjectAnalyticsService;

    @GetMapping("/subject/{classSubjectId}/students")
    public ResponseEntity<ApiResponse<List<SubjectAnalyticsDTO>>> getSubjectAnalytics(@PathVariable UUID classSubjectId) {
        try {
            List<SubjectAnalyticsDTO> analytics = subjectAnalyticsService.getSubjectAnalytics(classSubjectId);
            return ResponseEntity.ok(ApiResponse.success("Subject analytics fetched successfully", analytics));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/subject/{classSubjectId}/export")
    public ResponseEntity<byte[]> exportSubjectAnalyticsExcel(@PathVariable UUID classSubjectId) {
        try {
            byte[] excelFile = subjectAnalyticsService.exportSubjectAnalyticsExcel(classSubjectId);
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Student_Record.xlsx\"")
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(excelFile);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
