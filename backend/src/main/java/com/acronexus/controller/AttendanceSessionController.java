package com.acronexus.controller;

import com.acronexus.dto.AttendanceSessionDTO;
import com.acronexus.dto.CreateAttendanceSessionRequest;
import com.acronexus.service.AttendanceSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.acronexus.dto.MarkAttendanceRequest;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance-sessions")
@RequiredArgsConstructor
public class AttendanceSessionController {

    private final AttendanceSessionService sessionService;

    @GetMapping("/debug/db-check")
    public ResponseEntity<String> debugDbCheck() {
        return ResponseEntity.ok(sessionService.debugDbCheck());
    }

    @PostMapping("/debug/echo")
    public ResponseEntity<com.acronexus.dto.FacultyActivityBulkRequestDto> echoPayload(@RequestBody com.acronexus.dto.FacultyActivityBulkRequestDto dto) {
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<AttendanceSessionDTO> createSession(
            @PathVariable UUID facultyId,
            @RequestBody CreateAttendanceSessionRequest request) {
        return ResponseEntity.ok(sessionService.createSession(facultyId, request));
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<List<AttendanceSessionDTO>> getFacultySessions(
            @PathVariable UUID facultyId) {
        return ResponseEntity.ok(sessionService.getFacultySessions(facultyId));
    }

    @GetMapping("/faculty/{facultyId}/statistics")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<java.util.Map<String, Object>> getFacultyStatistics(@PathVariable UUID facultyId) {
        return ResponseEntity.ok(sessionService.getFacultyStatistics(facultyId));
    }

    @GetMapping("/faculty/{facultyId}/teaching-history")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<List<com.acronexus.dto.TeachingHistoryDTO>> getTeachingHistory(@PathVariable UUID facultyId) {
        return ResponseEntity.ok(sessionService.getTeachingHistory(facultyId));
    }

    @PostMapping("/faculty/{facultyId}/ai-generate-session")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<AttendanceSessionDTO> generateAiSession(
            @PathVariable UUID facultyId,
            @RequestParam UUID classSubjectId) {
        return ResponseEntity.ok(sessionService.generateAiSession(facultyId, classSubjectId));
    }

    @PostMapping("/{sessionId}/mark")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> markAttendance(
            @PathVariable UUID sessionId,
            @RequestBody MarkAttendanceRequest request,
            org.springframework.security.core.Authentication authentication) {
        com.acronexus.security.UserDetailsImpl userDetails = (com.acronexus.security.UserDetailsImpl) authentication.getPrincipal();
        sessionService.markAttendance(sessionId, request, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{sessionId}/status")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<AttendanceSessionDTO> updateStatus(
            @PathVariable UUID sessionId,
            @RequestParam com.acronexus.entity.AttendanceSessionStatus status) {
        return ResponseEntity.ok(sessionService.updateSessionStatus(sessionId, status));
    }

    @GetMapping("/{sessionId}/live")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<List<com.acronexus.dto.StudentAttendanceRecordDTO>> getLiveResponses(
            @PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.getLiveResponses(sessionId));
    }

    @PostMapping("/{sessionId}/bulk-approve-text")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<Void> bulkApproveText(
            @PathVariable UUID sessionId,
            @RequestBody com.acronexus.dto.BulkApproveTextRequest request) {
        sessionService.bulkApproveText(sessionId, request.getText());
        return ResponseEntity.ok().build();
    }



    @PostMapping("/{sessionId}/bulk-apply-review")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<Void> bulkApplyReview(
            @PathVariable UUID sessionId,
            @RequestBody com.acronexus.dto.BulkApplyReviewRequest request) {
        sessionService.bulkApplyReview(sessionId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/add-student/{enrollmentNumber}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<Void> addStudentToHistory(
            @PathVariable UUID sessionId,
            @PathVariable String enrollmentNumber) {
        sessionService.addStudentToHistory(sessionId, enrollmentNumber);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{sessionId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID sessionId) {
        sessionService.deleteSession(sessionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/class/{classSubjectId}/active")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<List<AttendanceSessionDTO>> getActiveSessionsForClass(
            @PathVariable UUID classSubjectId) {
        return ResponseEntity.ok(sessionService.getActiveSessionsForClass(classSubjectId));
    }

    @PutMapping("/{sessionId}/respond-request/{attendanceId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<Void> respondToRequest(
            @PathVariable UUID sessionId,
            @PathVariable UUID attendanceId,
            @RequestParam boolean accept) {
        sessionService.respondToRequest(sessionId, attendanceId, accept);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/bulk-respond")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'COORDINATOR', 'HOD')")
    public ResponseEntity<Void> bulkRespondToRequests(
            @PathVariable UUID sessionId,
            @RequestBody com.acronexus.dto.BulkRespondRequest request) {
        sessionService.bulkRespondToRequests(sessionId, request);
        return ResponseEntity.ok().build();
    }
}
