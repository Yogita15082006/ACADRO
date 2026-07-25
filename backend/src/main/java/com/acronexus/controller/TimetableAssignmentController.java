package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.TimetableReviewReportDto;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.TimetableAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/timetables")
@RequiredArgsConstructor
@Tag(name = "Timetable Assignments", description = "AI Matching and Assignment APIs")
public class TimetableAssignmentController {

    private final TimetableAssignmentService assignmentService;

    @PostMapping("/{id}/ai-match")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Perform AI Match on Timetable", description = "Extracts entity mappings using AI.")
    public ResponseEntity<ApiResponse<TimetableReviewReportDto>> aiMatch(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        TimetableReviewReportDto review = assignmentService.performAiMatch(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("AI Matching completed", review));
    }

    @PostMapping("/{id}/confirm-assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    @Operation(summary = "Confirm Timetable Assignments", description = "Saves ClassSubject and Coordinator mappings and triggers semester promotion.")
    public ResponseEntity<ApiResponse<Void>> confirmAssignments(
            @PathVariable UUID id,
            @RequestBody TimetableReviewReportDto reviewDto,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        assignmentService.confirmAssignments(id, reviewDto, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Assignments confirmed and saved successfully", null));
    }

    @GetMapping("/{id}/test-ai-match")
    public ResponseEntity<?> testAiMatch(@PathVariable UUID id) {
        try {
            // Mock requestedBy user ID with some random UUID because it's not strictly used for aiMatch logic (only for logging or fetching)
            TimetableReviewReportDto review = assignmentService.performAiMatch(id, UUID.randomUUID());
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(e.getMessage() + "\n" + e.getClass().getName());
        }
    }
}
