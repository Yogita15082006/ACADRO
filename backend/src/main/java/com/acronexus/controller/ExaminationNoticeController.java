package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.ExaminationNoticeRequestDto;
import com.acronexus.dto.ExaminationNoticeResponseDto;
import com.acronexus.service.ExaminationNoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/examination-notices")
@RequiredArgsConstructor
public class ExaminationNoticeController {

    private final ExaminationNoticeService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExaminationNoticeResponseDto>> create(@Valid @RequestBody ExaminationNoticeRequestDto requestDto) {
        ExaminationNoticeResponseDto created = service.create(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Notice created successfully", created));
    }

    @GetMapping("/examination/{examinationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ExaminationNoticeResponseDto>>> getByExaminationId(@PathVariable UUID examinationId) {
        List<ExaminationNoticeResponseDto> list = service.getByExaminationId(examinationId);
        return ResponseEntity.ok(ApiResponse.success("Notices fetched successfully", list));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Notice deleted successfully", null));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExaminationNoticeResponseDto>> update(@PathVariable UUID id, @Valid @RequestBody ExaminationNoticeRequestDto requestDto) {
        ExaminationNoticeResponseDto updated = service.update(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success("Notice updated successfully", updated));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<UUID>> uploadAttachment(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.acronexus.security.UserDetailsImpl currentUser) {
        UUID fileId = service.uploadAttachment(file, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", fileId));
    }

    @GetMapping("/file/{fileId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable UUID fileId) {
        return service.downloadAttachment(fileId);
    }
}
