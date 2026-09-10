package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.ExaminationAttendanceDto;
import com.acronexus.dto.ExaminationAttendanceSaveRequestDto;
import com.acronexus.service.ExaminationAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/examinations/{examinationId}/attendance")
@RequiredArgsConstructor
public class ExaminationAttendanceController {

    private final ExaminationAttendanceService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<ExaminationAttendanceDto>>> getAttendance(@PathVariable UUID examinationId) {
        List<ExaminationAttendanceDto> attendance = service.getAttendanceForExamination(examinationId);
        return ResponseEntity.ok(ApiResponse.success("Examination attendance fetched successfully", attendance));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> saveAttendance(
            @PathVariable UUID examinationId,
            @Valid @RequestBody ExaminationAttendanceSaveRequestDto requestDto) {
        service.saveAttendanceForExamination(examinationId, requestDto);
        return ResponseEntity.ok(ApiResponse.success("Examination attendance saved successfully", null));
    }
}
