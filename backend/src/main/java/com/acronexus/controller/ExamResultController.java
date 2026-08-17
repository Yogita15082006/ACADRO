package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.ExamResultRequestDto;
import com.acronexus.dto.ExamResultResponseDto;
import com.acronexus.service.ExamResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/exam-results")
@RequiredArgsConstructor
public class ExamResultController {

    private final ExamResultService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExamResultResponseDto>> create(@Valid @RequestBody ExamResultRequestDto requestDto) {
        ExamResultResponseDto created = service.create(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("ExamResult created successfully", created));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<ExamResultResponseDto>> getById(@PathVariable UUID id) {
        ExamResultResponseDto responseDto = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("ExamResult fetched successfully", responseDto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ExamResultResponseDto>>> getAll() {
        List<ExamResultResponseDto> list = service.getAll();
        return ResponseEntity.ok(ApiResponse.success("ExamResults fetched successfully", list));
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ExamResultResponseDto>>> search(
            @RequestParam UUID examinationId,
            @RequestParam(required = false) String className) {
        List<ExamResultResponseDto> list = service.findByExaminationAndClass(examinationId, className);
        return ResponseEntity.ok(ApiResponse.success("ExamResults fetched successfully", list));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExamResultResponseDto>> update(@PathVariable UUID id, @Valid @RequestBody ExamResultRequestDto requestDto) {
        ExamResultResponseDto updated = service.update(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success("ExamResult updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ExamResult deleted successfully", null));
    }
    
    @PostMapping("/publish")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> publishResults(
            @RequestParam UUID examinationId,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) UUID studentId) {
        int count = service.publishResults(examinationId, className, studentId);
        return ResponseEntity.ok(ApiResponse.success("Results published successfully", count));
    }
}
