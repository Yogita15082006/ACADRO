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
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExaminationNoticeResponseDto>> create(@Valid @RequestBody ExaminationNoticeRequestDto requestDto) {
        ExaminationNoticeResponseDto created = service.create(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Notice created successfully", created));
    }

    @GetMapping("/examination/{examinationId}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ExaminationNoticeResponseDto>>> getByExaminationId(@PathVariable UUID examinationId) {
        List<ExaminationNoticeResponseDto> list = service.getByExaminationId(examinationId);
        return ResponseEntity.ok(ApiResponse.success("Notices fetched successfully", list));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Notice deleted successfully", null));
    }
}
