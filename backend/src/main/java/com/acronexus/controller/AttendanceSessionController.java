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
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<AttendanceSessionDTO> createSession(
            @PathVariable UUID facultyId,
            @RequestBody CreateAttendanceSessionRequest request) {
        return ResponseEntity.ok(sessionService.createSession(facultyId, request));
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<List<AttendanceSessionDTO>> getFacultySessions(
            @PathVariable UUID facultyId) {
        return ResponseEntity.ok(sessionService.getFacultySessions(facultyId));
    }

    @GetMapping("/faculty/{facultyId}/statistics")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> getFacultyStatistics(@PathVariable UUID facultyId) {
        return ResponseEntity.ok(sessionService.getFacultyStatistics(facultyId));
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
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<AttendanceSessionDTO> updateStatus(
            @PathVariable UUID sessionId,
            @RequestParam com.acronexus.entity.AttendanceSessionStatus status) {
        return ResponseEntity.ok(sessionService.updateSessionStatus(sessionId, status));
    }

    @GetMapping("/{sessionId}/live")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<List<com.acronexus.dto.StudentAttendanceRecordDTO>> getLiveResponses(
            @PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.getLiveResponses(sessionId));
    }

    @PostMapping("/{sessionId}/bulk-approve-text")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<Void> bulkApproveText(
            @PathVariable UUID sessionId,
            @RequestBody com.acronexus.dto.BulkApproveTextRequest request) {
        sessionService.bulkApproveText(sessionId, request.getText());
        return ResponseEntity.ok().build();
    }



    @PostMapping("/{sessionId}/bulk-apply-review")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<Void> bulkApplyReview(
            @PathVariable UUID sessionId,
            @RequestBody com.acronexus.dto.BulkApplyReviewRequest request) {
        sessionService.bulkApplyReview(sessionId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/add-student/{enrollmentNumber}")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<Void> addStudentToHistory(
            @PathVariable UUID sessionId,
            @PathVariable String enrollmentNumber) {
        sessionService.addStudentToHistory(sessionId, enrollmentNumber);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{sessionId}")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID sessionId) {
        sessionService.deleteSession(sessionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/class/{classSubjectId}/active")
    @PreAuthorize("hasRole('STUDENT') or hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<List<AttendanceSessionDTO>> getActiveSessionsForClass(
            @PathVariable UUID classSubjectId) {
        return ResponseEntity.ok(sessionService.getActiveSessionsForClass(classSubjectId));
    }

    @PutMapping("/{sessionId}/respond-request/{attendanceId}")
    public ResponseEntity<Void> respondToRequest(
            @PathVariable UUID sessionId,
            @PathVariable UUID attendanceId,
            @RequestParam boolean accept) {
        sessionService.respondToRequest(sessionId, attendanceId, accept);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/bulk-respond")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<Void> bulkRespondToRequests(
            @PathVariable UUID sessionId,
            @RequestBody com.acronexus.dto.BulkRespondRequest request) {
        sessionService.bulkRespondToRequests(sessionId, request);
        return ResponseEntity.ok().build();
    }
}
