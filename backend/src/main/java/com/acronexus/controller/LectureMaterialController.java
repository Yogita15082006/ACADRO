package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.LectureMaterialRequestDto;
import com.acronexus.dto.LectureMaterialResponseDto;
import com.acronexus.service.LectureMaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lecture-materials")
@RequiredArgsConstructor
public class LectureMaterialController {

    private final LectureMaterialService service;

    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    // ==========================================
    // FACULTY ENDPOINTS
    // ==========================================

    @PostMapping("/faculty")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<LectureMaterialResponseDto>> uploadMaterial(
            @Valid @RequestBody LectureMaterialRequestDto requestDto,
            @RequestHeader("Authorization") String authHeader) {
        LectureMaterialResponseDto created = service.uploadMaterial(requestDto, extractToken(authHeader));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lecture material uploaded successfully", created));
    }

    @PutMapping("/faculty/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<LectureMaterialResponseDto>> updateMaterial(
            @PathVariable UUID id, 
            @Valid @RequestBody LectureMaterialRequestDto requestDto,
            @RequestHeader("Authorization") String authHeader) {
        LectureMaterialResponseDto updated = service.updateMaterial(id, requestDto, extractToken(authHeader));
        return ResponseEntity.ok(ApiResponse.success("Lecture material updated successfully", updated));
    }

    @DeleteMapping("/faculty/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        service.deleteMaterial(id, extractToken(authHeader));
        return ResponseEntity.ok(ApiResponse.success("Lecture material deleted successfully", null));
    }

    @GetMapping("/faculty")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<LectureMaterialResponseDto>>> getFacultyMaterials(
            @RequestHeader("Authorization") String authHeader) {
        List<LectureMaterialResponseDto> list = service.getFacultyMaterials(extractToken(authHeader));
        return ResponseEntity.ok(ApiResponse.success("Lecture materials fetched successfully", list));
    }

    // ==========================================
    // STUDENT ENDPOINTS
    // ==========================================

    @GetMapping("/student")
    @PreAuthorize("hasAnyRole('STUDENT', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<LectureMaterialResponseDto>>> getStudentMaterials(
            @RequestHeader("Authorization") String authHeader) {
        List<LectureMaterialResponseDto> list = service.getStudentMaterials(extractToken(authHeader));
        return ResponseEntity.ok(ApiResponse.success("Lecture materials fetched successfully", list));
    }

    @GetMapping("/student/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<LectureMaterialResponseDto>> getMaterialDetails(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        LectureMaterialResponseDto responseDto = service.getMaterialDetails(id, extractToken(authHeader));
        return ResponseEntity.ok(ApiResponse.success("Lecture material fetched successfully", responseDto));
    }

    @PostMapping("/student/{id}/download")
    @PreAuthorize("hasAnyRole('STUDENT', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> trackDownload(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        service.trackDownload(id, extractToken(authHeader));
        return ResponseEntity.ok(ApiResponse.success("Download tracked successfully", null));
    }

    @GetMapping("/student/{id}/study-guide")
    @PreAuthorize("hasAnyRole('STUDENT', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.ai.AiInsightDto>> generateStudyGuide(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(ApiResponse.success(
                "Study guide generated successfully", 
                service.generateStudyGuide(id, extractToken(authHeader))
        ));
    }

    @GetMapping("/student/{id}/summary")
    @PreAuthorize("hasAnyRole('STUDENT', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.ai.AiInsightDto>> summarizeMaterial(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(ApiResponse.success(
                "Material summary generated successfully", 
                service.summarizeMaterial(id, extractToken(authHeader))
        ));
    }
}
