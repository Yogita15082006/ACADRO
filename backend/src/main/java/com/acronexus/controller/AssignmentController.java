package com.acronexus.controller;

import com.acronexus.dto.AssignmentDto;
import com.acronexus.dto.AssignmentSubmissionDto;
import com.acronexus.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    // Endpoints below

    // ==========================================
    // FACULTY ENDPOINTS
    // ==========================================

    @PostMapping("/faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<AssignmentDto.Response> createAssignment(@Valid @RequestBody AssignmentDto.CreateRequest request) {
        return ResponseEntity.ok(assignmentService.createAssignment(request));
    }

    @PutMapping("/faculty/{assignmentId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<AssignmentDto.Response> updateAssignment(
            @PathVariable UUID assignmentId, 
            @Valid @RequestBody AssignmentDto.UpdateRequest request) {
        return ResponseEntity.ok(assignmentService.updateAssignment(assignmentId, request));
    }

    @DeleteMapping("/faculty/{assignmentId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<Void> deleteAssignment(@PathVariable UUID assignmentId) {
        assignmentService.deleteAssignment(assignmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<AssignmentDto.Response>> getFacultyAssignments() {
        return ResponseEntity.ok(assignmentService.getFacultyAssignments());
    }

    @GetMapping("/faculty/{assignmentId}/submissions")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<AssignmentSubmissionDto.Response>> getSubmissions(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(assignmentService.getSubmissionsForAssignment(assignmentId));
    }

    @PostMapping("/faculty/submissions/{submissionId}/evaluate")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<AssignmentSubmissionDto.Response> evaluateSubmission(
            @PathVariable UUID submissionId, 
            @Valid @RequestBody AssignmentSubmissionDto.EvaluateRequest request) {
        return ResponseEntity.ok(assignmentService.evaluateSubmission(submissionId, request));
    }

    @GetMapping("/faculty/{assignmentId}/ai/quality")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<com.acronexus.dto.ai.AiInsightDto> analyzeQuality(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(assignmentService.analyzeQuality(assignmentId));
    }

    @GetMapping("/faculty/submissions/{submissionId}/ai/plagiarism")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<com.acronexus.dto.ai.AiInsightDto> analyzePlagiarism(@PathVariable UUID submissionId) {
        return ResponseEntity.ok(assignmentService.analyzePlagiarism(submissionId));
    }

    @GetMapping("/faculty/submissions/{submissionId}/ai/feedback")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<com.acronexus.dto.ai.AiInsightDto> getFeedbackSuggestions(@PathVariable UUID submissionId) {
        return ResponseEntity.ok(assignmentService.getFeedbackSuggestions(submissionId));
    }

    // ==========================================
    // STUDENT ENDPOINTS
    // ==========================================

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<AssignmentDto.Response>> getStudentAssignments() {
        return ResponseEntity.ok(assignmentService.getStudentAssignments());
    }

    @GetMapping("/student/{assignmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AssignmentDto.Response> getAssignmentDetails(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(assignmentService.getAssignmentDetails(assignmentId));
    }

    @PostMapping("/student/{assignmentId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AssignmentSubmissionDto.Response> submitAssignment(
            @PathVariable UUID assignmentId, 
            @Valid @RequestBody AssignmentSubmissionDto.SubmitRequest request) {
        return ResponseEntity.ok(assignmentService.submitAssignment(assignmentId, request));
    }

    @GetMapping("/student/{assignmentId}/ai/late-risk")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<com.acronexus.dto.ai.AiInsightDto> predictLateSubmissionRisk(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(assignmentService.predictLateSubmissionRisk(assignmentId));
    }

}
