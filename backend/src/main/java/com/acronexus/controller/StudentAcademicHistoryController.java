package com.acronexus.controller;

import com.acronexus.dto.response.StudentAcademicHistoryResponseDto;
import com.acronexus.repository.AcademicYearRepository;
import com.acronexus.repository.SemesterRepository;
import com.acronexus.service.StudentAcademicHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hod/academic-history")
@RequiredArgsConstructor
public class StudentAcademicHistoryController {

    private final StudentAcademicHistoryService historyService;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;

    @GetMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<StudentAcademicHistoryResponseDto>> getFilteredHistory(
            @RequestParam(required = false) String academicYearId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String semesterId,
            @RequestParam(required = false) Integer semesterNumber,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        
        UUID resolvedAyId = resolveAcademicYearId(academicYearId != null && !academicYearId.trim().isEmpty() ? academicYearId : academicYear);
        UUID resolvedSemId = resolveSemesterId(semesterId != null && !semesterId.trim().isEmpty() ? semesterId : (semesterNumber != null ? String.valueOf(semesterNumber) : null));

        List<StudentAcademicHistoryResponseDto> result = historyService.getFilteredHistory(resolvedAyId, classId, section, resolvedSemId, status, search);
        return ResponseEntity.ok(result);
    }

    private static final UUID NON_EXISTENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private UUID resolveAcademicYearId(String param) {
        if (param == null || param.trim().isEmpty()) return null;
        String val = param.trim();
        try {
            return UUID.fromString(val);
        } catch (IllegalArgumentException e) {
            String digits = val.replaceAll("[^0-9]", "");
            if (!digits.isEmpty()) {
                return academicYearRepository.findByYear(digits)
                        .map(com.acronexus.entity.AcademicYear::getId)
                        .orElse(NON_EXISTENT_ID);
            }
            return academicYearRepository.findByYear(val)
                    .map(com.acronexus.entity.AcademicYear::getId)
                    .orElse(NON_EXISTENT_ID);
        }
    }

    private UUID resolveSemesterId(String param) {
        if (param == null || param.trim().isEmpty()) return null;
        String val = param.trim();
        try {
            return UUID.fromString(val);
        } catch (IllegalArgumentException e) {
            String digits = val.replaceAll("[^0-9]", "");
            if (!digits.isEmpty()) {
                try {
                    int semNum = Integer.parseInt(digits);
                    return semesterRepository.findAll().stream()
                            .filter(s -> s.getSemesterNumber() != null && s.getSemesterNumber() == semNum)
                            .map(com.acronexus.entity.Semester::getId)
                            .findFirst()
                            .orElse(NON_EXISTENT_ID);
                } catch (Exception ignored) {}
            }
            return NON_EXISTENT_ID;
        }
    }

    @GetMapping("/{studentId}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<StudentAcademicHistoryResponseDto>> getStudentHistory(@PathVariable UUID studentId) {
        List<StudentAcademicHistoryResponseDto> result = historyService.getStudentHistory(studentId);
        return ResponseEntity.ok(result);
    }
}
