package com.acronexus.controller;

import com.acronexus.dto.NoticeDto;
import com.acronexus.dto.NoticeRequest;
import com.acronexus.dto.NoticeSearchFilter;
import com.acronexus.security.JwtUtils;
import com.acronexus.service.NoticeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;
    private final JwtUtils jwtUtils;

    public NoticeController(NoticeService noticeService, JwtUtils jwtUtils) {
        this.noticeService = noticeService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<NoticeDto> createNotice(@Valid @RequestBody NoticeRequest request,
                                                  @RequestHeader("Authorization") String token) {
        UUID userId = jwtUtils.getUserIdFromToken(token.substring(7));
        return new ResponseEntity<>(noticeService.createNotice(request, userId), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<NoticeDto> updateNotice(@PathVariable UUID id,
                                                  @Valid @RequestBody NoticeRequest request,
                                                  @RequestHeader("Authorization") String token) {
        UUID userId = jwtUtils.getUserIdFromToken(token.substring(7));
        return ResponseEntity.ok(noticeService.updateNotice(id, request, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<Void> deleteNotice(@PathVariable UUID id,
                                             @RequestHeader("Authorization") String token) {
        UUID userId = jwtUtils.getUserIdFromToken(token.substring(7));
        noticeService.deleteNotice(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<NoticeDto> publishNotice(@PathVariable UUID id,
                                                   @RequestHeader("Authorization") String token) {
        UUID userId = jwtUtils.getUserIdFromToken(token.substring(7));
        return ResponseEntity.ok(noticeService.publishNotice(id, userId));
    }

    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<NoticeDto> unpublishNotice(@PathVariable UUID id,
                                                     @RequestHeader("Authorization") String token) {
        UUID userId = jwtUtils.getUserIdFromToken(token.substring(7));
        return ResponseEntity.ok(noticeService.unpublishNotice(id, userId));
    }

    @GetMapping("/student/my-notices")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<NoticeDto>> getStudentNotices(@RequestHeader("Authorization") String token) {
        UUID studentId = jwtUtils.getUserIdFromToken(token.substring(7));
        return ResponseEntity.ok(noticeService.getStudentNotices(studentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoticeDto> getNoticeDetails(@PathVariable UUID id,
                                                      @RequestHeader("Authorization") String token) {
        UUID userId = jwtUtils.getUserIdFromToken(token.substring(7));
        return ResponseEntity.ok(noticeService.getNoticeDetails(id, userId));
    }

    @PostMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<List<NoticeDto>> searchNotices(@RequestBody NoticeSearchFilter filter,
                                                         @RequestHeader("Authorization") String token) {
        UUID userId = jwtUtils.getUserIdFromToken(token.substring(7));
        return ResponseEntity.ok(noticeService.searchNotices(filter, userId));
    }
    @GetMapping("/{id}/summary")
    public ResponseEntity<com.acronexus.dto.ai.AiInsightDto> summarizeNotice(@PathVariable UUID id,
                                                                             @RequestHeader("Authorization") String token) {
        UUID userId = jwtUtils.getUserIdFromToken(token.substring(7));
        return ResponseEntity.ok(noticeService.summarizeNotice(id, userId));
    }

    @GetMapping("/student/highlights")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<com.acronexus.dto.ai.AiInsightDto> getImportantNoticeHighlights(@RequestHeader("Authorization") String token) {
        UUID studentId = jwtUtils.getUserIdFromToken(token.substring(7));
        return ResponseEntity.ok(noticeService.getImportantNoticeHighlights(studentId));
    }

    @GetMapping("/student/recommendations")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<com.acronexus.dto.ai.AiInsightDto> getPersonalizedRecommendations(@RequestHeader("Authorization") String token) {
        UUID studentId = jwtUtils.getUserIdFromToken(token.substring(7));
        return ResponseEntity.ok(noticeService.getPersonalizedRecommendations(studentId));
    }
}
