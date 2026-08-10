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
}
