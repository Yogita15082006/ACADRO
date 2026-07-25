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

    @PostMapping("/{sessionId}/mark")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> markAttendance(
            @PathVariable UUID sessionId,
            @RequestBody MarkAttendanceRequest request) {
        sessionService.markAttendance(sessionId, request);
        return ResponseEntity.ok().build();
    }
}
