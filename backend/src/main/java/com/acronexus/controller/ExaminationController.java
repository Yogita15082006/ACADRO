package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.ExaminationRequestDto;
import com.acronexus.dto.ExaminationResponseDto;
import com.acronexus.service.ExaminationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/examinations")
@RequiredArgsConstructor
public class ExaminationController {

    private final ExaminationService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExaminationResponseDto>> create(@Valid @RequestBody ExaminationRequestDto requestDto) {
        ExaminationResponseDto created = service.create(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Examination created successfully", created));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<ExaminationResponseDto>> getById(@PathVariable UUID id) {
        ExaminationResponseDto responseDto = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Examination fetched successfully", responseDto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ExaminationResponseDto>>> getAll() {
        List<ExaminationResponseDto> list = service.getAll();
        return ResponseEntity.ok(ApiResponse.success("Examinations fetched successfully", list));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExaminationResponseDto>> update(@PathVariable UUID id, @Valid @RequestBody ExaminationRequestDto requestDto) {
        ExaminationResponseDto updated = service.update(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success("Examination updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Examination deleted successfully", null));
    }

    @PostMapping("/{id}/generate-eligibility")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'COORDINATOR', 'HOD')")
    public ResponseEntity<ApiResponse<java.util.List<com.acronexus.dto.ExaminationEligibilityStudentDto>>> generateEligibilityList(
            @PathVariable UUID id, @RequestBody com.acronexus.dto.EligibilityGenerationRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Eligibility list generated successfully", service.generateEligibilityList(id, request)));
    }

    @GetMapping("/{id}/eligibility-metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'COORDINATOR', 'HOD')")
    public ResponseEntity<ApiResponse<java.util.List<com.acronexus.dto.ExaminationEligibilityMetricsDto>>> getEligibilityMetrics(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Eligibility metrics retrieved successfully", service.getEligibilityMetrics(id)));
    }

    @PostMapping("/{id}/eligibility-list")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'COORDINATOR', 'HOD')")
    public ResponseEntity<ApiResponse<java.util.List<com.acronexus.dto.ExaminationEligibilityListDto>>> saveEligibilityList(
            @PathVariable UUID id, @RequestBody com.acronexus.dto.ExaminationEligibilityListDto request) {
        return ResponseEntity.ok(ApiResponse.success("Eligibility list saved successfully", service.saveEligibilityList(id, request)));
    }

    @GetMapping("/{id}/eligibility-list")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'COORDINATOR', 'HOD')")
    public ResponseEntity<ApiResponse<java.util.List<com.acronexus.dto.ExaminationEligibilityListDto>>> getEligibilityList(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Eligibility lists retrieved successfully", service.getEligibilityList(id)));
    }
    
    @DeleteMapping("/{id}/eligibility-list/{listId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'COORDINATOR', 'HOD')")
    public ResponseEntity<ApiResponse<Void>> deleteEligibilityList(@PathVariable UUID id, @PathVariable UUID listId) {
        service.deleteEligibilityList(id, listId);
        return ResponseEntity.ok(ApiResponse.success("Eligibility list deleted successfully", null));
    }

    @PostMapping("/{id}/timetable")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExaminationResponseDto>> uploadTimetable(@PathVariable UUID id, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        ExaminationResponseDto responseDto = service.uploadTimetable(id, file);
        return ResponseEntity.ok(ApiResponse.success("Timetable uploaded successfully", responseDto));
    }

    @DeleteMapping("/{id}/timetable/{timetableId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> deleteTimetable(@PathVariable UUID id, @PathVariable UUID timetableId) {
        service.deleteTimetable(id, timetableId);
        return ResponseEntity.ok(ApiResponse.success("Timetable deleted successfully", null));
    }

    @GetMapping("/{id}/timetable/{timetableId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public org.springframework.http.ResponseEntity<byte[]> downloadTimetable(@PathVariable UUID id, @PathVariable UUID timetableId) {
        return service.downloadTimetable(id, timetableId);
    }
}