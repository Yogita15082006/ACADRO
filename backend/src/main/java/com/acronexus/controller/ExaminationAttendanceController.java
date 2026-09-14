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
    public ResponseEntity<ApiResponse<List<ExaminationAttendanceDto>>> getAttendance(
            @PathVariable UUID examinationId,
            @RequestParam(required = false) java.time.LocalDate examDate,
            @RequestParam(required = false) List<UUID> subjectIds) {
        List<ExaminationAttendanceDto> attendance = service.getAttendanceForExamination(examinationId);
        
        if (examDate != null) {
            attendance = attendance.stream()
                .filter(a -> a.getExamDate() != null && a.getExamDate().equals(examDate))
                .toList();
        }
        if (subjectIds != null && !subjectIds.isEmpty()) {
            attendance = attendance.stream()
                .filter(a -> a.getClassSubjectId() == null || subjectIds.contains(a.getClassSubjectId()))
                .toList();
        }
        
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

    @DeleteMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> deleteAttendance(
            @PathVariable UUID examinationId,
            @RequestParam(required = false) java.time.LocalDate examDate,
            @RequestParam(required = false) UUID classSubjectId) {
        service.deleteAttendanceContext(examinationId, examDate, classSubjectId);
        return ResponseEntity.ok(ApiResponse.success("Examination attendance deleted successfully", null));
    }

    @GetMapping("/dates")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<java.time.LocalDate>>> getAvailableAttendanceDates(
            @PathVariable UUID examinationId,
            @RequestParam UUID classSubjectId) {
        List<java.time.LocalDate> dates = service.getAvailableAttendanceDates(examinationId, classSubjectId);
        return ResponseEntity.ok(ApiResponse.success("Available attendance dates fetched successfully", dates));
    }
}
