package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.SubjectAnnouncementRequestDto;
import com.acronexus.dto.SubjectAnnouncementResponseDto;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.SubjectAnnouncementService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/subject-announcements")
@RequiredArgsConstructor
public class SubjectAnnouncementController {

    private final SubjectAnnouncementService subjectAnnouncementService;

    @GetMapping("/subject/{classSubjectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT', 'COORDINATOR')")
    @Operation(summary = "Get Subject Announcements", description = "Retrieves announcements filtered by Subject Card and enrollment/assignment.")
    public ResponseEntity<ApiResponse<List<SubjectAnnouncementResponseDto>>> getAnnouncements(
            @PathVariable UUID classSubjectId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<SubjectAnnouncementResponseDto> list = subjectAnnouncementService.getAnnouncementsForSubject(classSubjectId, userDetails);
        return ResponseEntity.ok(ApiResponse.success("Subject announcements retrieved successfully", list));
    }

    @PostMapping("/subject/{classSubjectId}")
    @PreAuthorize("hasRole('FACULTY')")
    @Operation(summary = "Post Subject Announcement", description = "Allows officially assigned faculty to broadcast an announcement to students.")
    public ResponseEntity<ApiResponse<SubjectAnnouncementResponseDto>> createAnnouncement(
            @PathVariable UUID classSubjectId,
            @Valid @RequestBody SubjectAnnouncementRequestDto requestDto,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        SubjectAnnouncementResponseDto created = subjectAnnouncementService.createAnnouncement(classSubjectId, requestDto, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Announcement posted successfully", created));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FACULTY')")
    @Operation(summary = "Delete Subject Announcement", description = "Allows authoring faculty to delete their posted announcement.")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        subjectAnnouncementService.deleteAnnouncement(id, userDetails);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted successfully", null));
    }
}
