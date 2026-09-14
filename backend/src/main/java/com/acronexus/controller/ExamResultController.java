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

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<ExamResultResponseDto>>> createBulk(@Valid @RequestBody com.acronexus.dto.BulkExamResultRequestDto requestDto) {
        List<ExamResultResponseDto> createdList = service.createBulk(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bulk ExamResults saved successfully", createdList));
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
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate examDate,
            @RequestParam(required = false) UUID classSubjectId,
            @RequestParam(required = false) String className) {
        List<ExamResultResponseDto> list;
        if (examDate != null && classSubjectId != null) {
            list = service.findByExaminationAndContext(examinationId, examDate, classSubjectId, className);
        } else {
            list = service.findByExaminationAndClass(examinationId, className);
        }
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
    
    @DeleteMapping("/class")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> deleteResultsForClass(
            @RequestParam UUID examinationId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate examDate,
            @RequestParam(required = false) UUID classSubjectId,
            @RequestParam(required = false) String className) {
        if (examDate != null && classSubjectId != null) {
            service.deleteResultsForContext(examinationId, examDate, classSubjectId);
        } else {
            service.deleteResultsForClass(examinationId, className);
        }
        return ResponseEntity.ok(ApiResponse.success("ExamResults deleted successfully", null));
    }

    @GetMapping("/examinations/{examinationId}/present-students")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<com.acronexus.dto.PresentStudentDto>>> getPresentStudents(
            @PathVariable UUID examinationId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate examDate,
            @RequestParam UUID classSubjectId) {
        List<com.acronexus.dto.PresentStudentDto> students = service.getPresentStudentsByContext(examinationId, examDate, classSubjectId);
        return ResponseEntity.ok(ApiResponse.success("Present students fetched successfully", students));
    }

    @GetMapping("/examinations/{examinationId}/present-students/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<byte[]> exportPresentStudentsExcel(
            @PathVariable UUID examinationId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate examDate,
            @RequestParam UUID classSubjectId) {
        byte[] excelData = service.exportPresentStudentsExcelByContext(examinationId, examDate, classSubjectId);
        
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "Present_Students.xlsx");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
    }
    
    @PostMapping("/publish")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> publishResults(
            @RequestParam UUID examinationId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate examDate,
            @RequestParam UUID classSubjectId,
            @RequestParam(required = false) UUID studentId) {
        int count = service.publishResultsForContext(examinationId, examDate, classSubjectId, studentId);
        return ResponseEntity.ok(ApiResponse.success("Results published successfully", count));
    }



    @GetMapping("/examinations/{examinationId}/context")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<java.util.List<com.acronexus.dto.ExamResultContextRowDto>>> getResultContext(
            @PathVariable UUID examinationId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate examDate,
            @RequestParam UUID classSubjectId) {
        java.util.List<com.acronexus.dto.ExamResultContextRowDto> contextRows = service.getResultContext(examinationId, examDate, classSubjectId);
        return ResponseEntity.ok(ApiResponse.success("Exam Result context fetched successfully", contextRows));
    }

    @GetMapping("/examinations/{examinationId}/saved-contexts")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<java.util.List<com.acronexus.dto.SavedResultContextDto>>> getSavedContexts(
            @PathVariable UUID examinationId) {
        java.util.List<com.acronexus.dto.SavedResultContextDto> savedContexts = service.getSavedContexts(examinationId);
        return ResponseEntity.ok(ApiResponse.success("Saved contexts fetched successfully", savedContexts));
    }

    @GetMapping("/examinations/{examinationId}/context/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<byte[]> exportResultContextExcel(
            @PathVariable UUID examinationId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate examDate,
            @RequestParam UUID classSubjectId) {
        byte[] excelData = service.exportResultContextExcel(examinationId, examDate, classSubjectId);
        
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "Exam_Results_List.xlsx");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
    }
    
    @PostMapping("/context/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Integer>> bulkSaveResults(
            @RequestParam UUID examinationId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate examDate,
            @RequestParam UUID classSubjectId,
            @RequestBody java.util.List<com.acronexus.dto.ExamResultContextRowDto> results) {
        int savedCount = service.bulkSaveResults(examinationId, examDate, classSubjectId, results);
        return ResponseEntity.ok(ApiResponse.success("Results bulk saved successfully", savedCount));
    }
}
