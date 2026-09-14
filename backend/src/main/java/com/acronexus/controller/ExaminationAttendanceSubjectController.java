package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.ExaminationAttendanceSubjectDto;
import com.acronexus.service.ExaminationAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/examinations/subject-attendance")
@RequiredArgsConstructor
public class ExaminationAttendanceSubjectController {

    private final ExaminationAttendanceService service;

    @GetMapping("/{classSubjectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ExaminationAttendanceSubjectDto>>> getAttendanceForSubject(
            @PathVariable UUID classSubjectId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Subject examination attendance fetched successfully",
                service.getAttendanceForClassSubject(classSubjectId)
        ));
    }
}
