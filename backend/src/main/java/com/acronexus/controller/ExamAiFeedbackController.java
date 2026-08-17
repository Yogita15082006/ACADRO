package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.ExamAiFeedbackRequestDto;
import com.acronexus.dto.ExamAiFeedbackResponseDto;
import com.acronexus.service.ExamAiFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/exam-ai-feedback")
@RequiredArgsConstructor
public class ExamAiFeedbackController {

    private final ExamAiFeedbackService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExamAiFeedbackResponseDto>> create(@Valid @RequestBody ExamAiFeedbackRequestDto requestDto) {
        ExamAiFeedbackResponseDto created = service.create(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("ExamAiFeedback created successfully", created));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<ExamAiFeedbackResponseDto>> getById(@PathVariable UUID id) {
        ExamAiFeedbackResponseDto responseDto = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("ExamAiFeedback fetched successfully", responseDto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ExamAiFeedbackResponseDto>>> getAll() {
        List<ExamAiFeedbackResponseDto> list = service.getAll();
        return ResponseEntity.ok(ApiResponse.success("ExamAiFeedbacks fetched successfully", list));
    }
    
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<ExamAiFeedbackResponseDto>>> generate(
            @RequestParam UUID examinationId, 
            @RequestParam(required = false) String className) {
        List<ExamAiFeedbackResponseDto> list = service.generateFeedbackForClass(examinationId, className);
        return ResponseEntity.ok(ApiResponse.success("AI feedback generated successfully", list));
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ExamAiFeedbackResponseDto>>> search(
            @RequestParam UUID examinationId, 
            @RequestParam(required = false) String className) {
        List<ExamAiFeedbackResponseDto> list = service.searchFeedback(examinationId, className);
        return ResponseEntity.ok(ApiResponse.success("AI feedback fetched successfully", list));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExamAiFeedbackResponseDto>> update(@PathVariable UUID id, @Valid @RequestBody ExamAiFeedbackRequestDto requestDto) {
        ExamAiFeedbackResponseDto updated = service.update(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success("ExamAiFeedback updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ExamAiFeedback deleted successfully", null));
    }
}
