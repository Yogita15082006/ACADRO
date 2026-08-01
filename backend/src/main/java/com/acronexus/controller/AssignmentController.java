package com.acronexus.controller;

import com.acronexus.dto.AssignmentDto;
import com.acronexus.dto.AssignmentSubmissionDto;
import com.acronexus.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.acronexus.security.UserDetailsImpl;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import com.acronexus.dto.ApiResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/assignments", "/api/v1/assignments"})
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
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
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

    // ==========================================
    // DYNAMIC LMS ENDPOINTS (SUBJECT CARDS & MODULE)
    // ==========================================
    @GetMapping("/subject/{classSubjectId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AssignmentDto.Response>>> getAssignmentsBySubject(
            @PathVariable UUID classSubjectId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Assignments retrieved", assignmentService.getAssignmentsBySubject(classSubjectId, userDetails)));
    }

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AssignmentDto.Response>>> getAllAssignments(
            @RequestParam(required = false) String classId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success("All assignments retrieved", assignmentService.getAllAssignments(classId, userDetails)));
    }

    @PostMapping(value = "/subject/{classSubjectId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentDto.Response>> uploadAssignment(
            @PathVariable UUID classSubjectId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "instructions", required = false) String instructions,
            @RequestParam(value = "gradingCriteria", required = false) String gradingCriteria,
            @RequestParam(value = "allowedFileTypes", required = false) String allowedFileTypes,
            @RequestParam(value = "maxUploadSize", required = false) String maxUploadSize,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "lateSubmissionAllowed", required = false) Boolean lateSubmissionAllowed,
            @RequestParam(value = "penaltyForLateSubmission", required = false) Integer penaltyForLateSubmission,
            @RequestParam(value = "maxMarks", required = false) Integer maxMarks,
            @RequestParam(value = "deadlineStr", required = false) String deadlineStr,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success("Assignment created dynamically", assignmentService.uploadAssignment(
                        classSubjectId, file, title, description, instructions, gradingCriteria, allowedFileTypes, maxUploadSize, type, lateSubmissionAllowed, penaltyForLateSubmission, maxMarks, deadlineStr, userDetails)));
    }

    @PutMapping("/{assignmentId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentDto.Response>> editAssignment(
            @PathVariable UUID assignmentId,
            @RequestBody AssignmentDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Assignment updated", assignmentService.editAssignment(assignmentId, request, userDetails)));
    }

    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeAssignment(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        assignmentService.removeAssignment(assignmentId, userDetails);
        return ResponseEntity.ok(ApiResponse.success("Assignment cleanly removed", null));
    }

    @GetMapping("/{assignmentId}/download")
    public ResponseEntity<byte[]> downloadAssignmentFile(@PathVariable UUID assignmentId) {
        byte[] fileData = assignmentService.downloadAssignmentFile(assignmentId);
        String fileName = assignmentService.getAssignmentFileName(assignmentId);
        String mimeType = assignmentService.getAssignmentFileMimeType(assignmentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileData != null ? fileData.length : 0))
                .contentType(resolveMediaType(mimeType, fileName))
                .body(fileData);
    }

    @GetMapping("/{assignmentId}/view")
    public ResponseEntity<byte[]> viewAssignmentFile(@PathVariable UUID assignmentId) {
        byte[] fileData = assignmentService.downloadAssignmentFile(assignmentId);
        String fileName = assignmentService.getAssignmentFileName(assignmentId);
        String mimeType = assignmentService.getAssignmentFileMimeType(assignmentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileData != null ? fileData.length : 0))
                .contentType(resolveMediaType(mimeType, fileName))
                .body(fileData);
    }

    @PostMapping(value = "/{assignmentId}/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AssignmentSubmissionDto.Response>> submitStudentAssignment(
            @PathVariable UUID assignmentId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Assignment submitted successfully", assignmentService.submitStudentAssignment(assignmentId, file, userDetails)));
    }

    @GetMapping("/submissions/{submissionId}/download")
    public ResponseEntity<byte[]> downloadSubmissionFile(@PathVariable UUID submissionId) {
        byte[] fileData = assignmentService.downloadSubmissionFile(submissionId);
        String fileName = assignmentService.getSubmissionFileName(submissionId);
        String mimeType = assignmentService.getSubmissionFileMimeType(submissionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileData != null ? fileData.length : 0))
                .contentType(resolveMediaType(mimeType, fileName))
                .body(fileData);
    }

    @GetMapping("/submissions/{submissionId}/view")
    public ResponseEntity<byte[]> viewSubmissionFile(@PathVariable UUID submissionId) {
        byte[] fileData = assignmentService.downloadSubmissionFile(submissionId);
        String fileName = assignmentService.getSubmissionFileName(submissionId);
        String mimeType = assignmentService.getSubmissionFileMimeType(submissionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileData != null ? fileData.length : 0))
                .contentType(resolveMediaType(mimeType, fileName))
                .body(fileData);
    }

    @GetMapping("/{assignmentId}/submissions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AssignmentSubmissionDto.Response>>> getAssignmentSubmissions(
            @PathVariable UUID assignmentId) {
        return ResponseEntity.ok(ApiResponse.success("Submissions retrieved", assignmentService.getSubmissionsForAssignment(assignmentId)));
    }

    @GetMapping("/subject/{classSubjectId}/my-submissions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AssignmentSubmissionDto.Response>>> getMySubmissions(
            @PathVariable(required = false) UUID classSubjectId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Student submissions retrieved", assignmentService.getStudentSubmissions(classSubjectId, userDetails)));
    }

    @GetMapping("/{assignmentId}/enrolled-students")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> getEnrolledStudents(
            @PathVariable UUID assignmentId) {
        return ResponseEntity.ok(ApiResponse.success("Enrolled students retrieved successfully", assignmentService.getEnrolledStudentsForAssignment(assignmentId)));
    }

    @PostMapping("/submissions/{submissionId}/evaluate")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentSubmissionDto.Response>> evaluateStudentSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody AssignmentSubmissionDto.EvaluateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Submission evaluated successfully", assignmentService.evaluateSubmission(submissionId, request)));
    }

    private MediaType getMediaType(String fileName) {
        if (fileName == null) return MediaType.APPLICATION_OCTET_STREAM;
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".doc")) return MediaType.valueOf("application/msword");
        if (lower.endsWith(".docx")) return MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        if (lower.endsWith(".ppt")) return MediaType.valueOf("application/vnd.ms-powerpoint");
        if (lower.endsWith(".pptx")) return MediaType.valueOf("application/vnd.openxmlformats-officedocument.presentationml.presentation");
        if (lower.endsWith(".txt")) return MediaType.TEXT_PLAIN;
        if (lower.endsWith(".zip")) return MediaType.valueOf("application/zip");
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    private MediaType resolveMediaType(String mimeType, String fileName) {
        if (mimeType != null && !mimeType.trim().isEmpty() && !mimeType.equalsIgnoreCase("application/octet-stream")) {
            try {
                return MediaType.parseMediaType(mimeType.trim());
            } catch (Exception ignored) {}
        }
        return getMediaType(fileName);
    }
}
