package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.request.EventRequest;
import com.acronexus.dto.response.EventRegistrationResponse;
import com.acronexus.dto.response.EventResponse;
import com.acronexus.dto.response.ParticipantExportDto;
import com.acronexus.security.UserDetailsImpl;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.acronexus.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.createEvent(request, currentUser.getId()));
    }

    @PutMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable UUID eventId,
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.updateEvent(eventId, request, currentUser.getId()));
    }

    @DeleteMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.deleteEvent(eventId, currentUser.getId()));
    }

    @PatchMapping("/{eventId}/toggle-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<EventResponse>> toggleEventStatus(
            @PathVariable UUID eventId,
            @RequestParam boolean isActive,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.toggleEventPublishStatus(eventId, isActive, currentUser.getId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<Page<EventResponse>>> getAllEvents(
            Pageable pageable,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.getAllEvents(pageable, currentUser.getId()));
    }

    @GetMapping("/{eventId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.getEventById(eventId, currentUser.getId()));
    }

    // Student endpoints

    @GetMapping("/available")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAvailableEvents(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.getAvailableEventsForStudent(currentUser.getId()));
    }

    @GetMapping("/my-registrations")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<EventRegistrationResponse>>> getMyRegistrations(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.getStudentRegistrations(currentUser.getId()));
    }

    @PostMapping("/{eventId}/register")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<EventRegistrationResponse>> registerForEvent(
            @PathVariable UUID eventId,
            @RequestBody(required = false) com.acronexus.dto.request.EventRegistrationRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.registerForEvent(eventId, request, currentUser.getId()));
    }

    @DeleteMapping("/{eventId}/register")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> cancelRegistration(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.cancelRegistration(eventId, currentUser.getId()));
    }

    // Admin/Faculty registration management endpoints

    @GetMapping("/{eventId}/registrations")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<Page<EventRegistrationResponse>>> getEventRegistrations(
            @PathVariable UUID eventId,
            Pageable pageable,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.getEventRegistrations(eventId, pageable, currentUser.getId()));
    }

    @GetMapping("/{eventId}/export-participants")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<ParticipantExportDto>>> exportParticipants(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.exportParticipantList(eventId, currentUser.getId()));
    }

    // --- Metadata Endpoints ---

    @GetMapping("/metadata/batches")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableBatches() {
        return ResponseEntity.ok(eventService.getAvailableBatches());
    }

    @GetMapping("/metadata/years")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableYears(@RequestParam String batchYear) {
        return ResponseEntity.ok(eventService.getAvailableYears(batchYear));
    }

    @GetMapping("/metadata/semesters")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableSemesters(@RequestParam String batchYear, @RequestParam String academicYear) {
        return ResponseEntity.ok(eventService.getAvailableSemesters(batchYear, academicYear));
    }

    @GetMapping("/metadata/classes")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<com.acronexus.entity.AcroClass>>> getAvailableClasses(
            @RequestParam String batchYear, @RequestParam String academicYear, @RequestParam String semester) {
        return ResponseEntity.ok(eventService.getAvailableClasses(batchYear, academicYear, semester));
    }

    // --- AI Integration ---

    @PostMapping("/ai/generate-form")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<String>> generateAiForm(
            @RequestBody java.util.Map<String, String> payload,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.generateAiRegistrationForm(payload.get("prompt"), currentUser.getId()));
    }

    // --- Notices Endpoints ---

    @PostMapping("/{eventId}/notices")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.response.EventNoticeResponse>> publishNotice(
            @PathVariable UUID eventId,
            @Valid @RequestBody com.acronexus.dto.request.EventNoticeRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.publishNotice(eventId, request, currentUser.getId()));
    }

    @PutMapping("/notices/{noticeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.response.EventNoticeResponse>> updateNotice(
            @PathVariable UUID noticeId,
            @Valid @RequestBody com.acronexus.dto.request.EventNoticeRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.updateNotice(noticeId, request, currentUser.getId()));
    }

    @DeleteMapping("/notices/{noticeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> deleteNotice(
            @PathVariable UUID noticeId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.deleteNotice(noticeId, currentUser.getId()));
    }

    // --- Attendance Endpoints ---

    @PostMapping("/attendance/sessions/{sessionId}/generate-code")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse>> generateAttendanceCode(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.generateAttendanceCode(sessionId, currentUser.getId()));
    }

    @PostMapping("/attendance/sessions/{sessionId}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse>> startAttendance(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.startAttendance(sessionId, currentUser.getId()));
    }

    @PostMapping("/attendance/sessions/{sessionId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse>> closeAttendance(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.closeAttendance(sessionId, currentUser.getId()));
    }

    @PatchMapping("/attendance/sessions/{sessionId}/unique-code-count")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse>> updateUniqueCodeCount(
            @PathVariable UUID sessionId,
            @RequestParam Integer count,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(eventService.updateUniqueCodeCount(sessionId, count, currentUser.getId()));
    }

    @PostMapping("/attendance/sessions/{sessionId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> submitAttendance(
            @PathVariable UUID sessionId,
            @RequestBody java.util.Map<String, Object> payload,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        String code = (String) payload.get("attendanceCode");
        Integer uniqueCode = (Integer) payload.get("uniqueCode");
        return ResponseEntity.ok(eventService.submitAttendance(sessionId, code, uniqueCode, currentUser.getId()));
    }


}

