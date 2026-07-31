package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.CoordinatorAssignmentRequestDto;
import com.acronexus.dto.CoordinatorAssignmentResponseDto;
import com.acronexus.service.CoordinatorAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/coordinator-assignments")
@RequiredArgsConstructor
public class CoordinatorAssignmentController {

    private final CoordinatorAssignmentService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<CoordinatorAssignmentResponseDto>> create(@Valid @RequestBody CoordinatorAssignmentRequestDto requestDto) {
        CoordinatorAssignmentResponseDto created = service.create(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("CoordinatorAssignment created successfully", created));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<CoordinatorAssignmentResponseDto>> getById(@PathVariable UUID id) {
        CoordinatorAssignmentResponseDto responseDto = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("CoordinatorAssignment fetched successfully", responseDto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<CoordinatorAssignmentResponseDto>>> getAll() {
        List<CoordinatorAssignmentResponseDto> list = service.getAll();
        return ResponseEntity.ok(ApiResponse.success("CoordinatorAssignments fetched successfully", list));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<CoordinatorAssignmentResponseDto>> update(@PathVariable UUID id, @Valid @RequestBody CoordinatorAssignmentRequestDto requestDto) {
        CoordinatorAssignmentResponseDto updated = service.update(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success("CoordinatorAssignment updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("CoordinatorAssignment deleted successfully", null));
    }
}
