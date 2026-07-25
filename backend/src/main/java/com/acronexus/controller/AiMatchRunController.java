package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.AiMatchRunRequestDto;
import com.acronexus.dto.AiMatchRunResponseDto;
import com.acronexus.service.AiMatchRunService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai-match-runs")
@PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
@RequiredArgsConstructor
public class AiMatchRunController {

    private final AiMatchRunService service;

    @PostMapping
    public ResponseEntity<ApiResponse<AiMatchRunResponseDto>> create(@Valid @RequestBody AiMatchRunRequestDto requestDto) {
        AiMatchRunResponseDto created = service.create(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("AiMatchRun created successfully", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AiMatchRunResponseDto>> getById(@PathVariable UUID id) {
        AiMatchRunResponseDto responseDto = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("AiMatchRun fetched successfully", responseDto));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AiMatchRunResponseDto>>> getAll() {
        List<AiMatchRunResponseDto> list = service.getAll();
        return ResponseEntity.ok(ApiResponse.success("AiMatchRuns fetched successfully", list));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AiMatchRunResponseDto>> update(@PathVariable UUID id, @Valid @RequestBody AiMatchRunRequestDto requestDto) {
        AiMatchRunResponseDto updated = service.update(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success("AiMatchRun updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("AiMatchRun deleted successfully", null));
    }

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<com.acronexus.dto.ai.AiMatchResponse>> executeMatch() {
        com.acronexus.dto.ai.AiMatchResponse result = service.executeMatch();
        return ResponseEntity.ok(ApiResponse.success("AI Match execution completed successfully", result));
    }

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<Void>> applyChanges(@RequestBody com.acronexus.dto.ai.AiMatchResponse aiMatchResponse) {
        service.applyChanges(aiMatchResponse);
        return ResponseEntity.ok(ApiResponse.success("AI changes applied successfully", null));
    }
}
