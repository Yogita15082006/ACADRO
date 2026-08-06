package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.FacultyActivityRequestDto;
import com.acronexus.dto.FacultyActivityResponseDto;
import com.acronexus.service.FacultyActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/faculty-activities")
@RequiredArgsConstructor
public class FacultyActivityController {

    private final FacultyActivityService service;

    @PostMapping
    public ResponseEntity<ApiResponse<FacultyActivityResponseDto>> create(@Valid @RequestBody FacultyActivityRequestDto requestDto, org.springframework.security.core.Authentication authentication) {
        com.acronexus.security.UserDetailsImpl userDetails = (com.acronexus.security.UserDetailsImpl) authentication.getPrincipal();
        FacultyActivityResponseDto created = service.create(requestDto, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("FacultyActivity created successfully", created));
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<FacultyActivityResponseDto>>> bulkCreate(@Valid @RequestBody com.acronexus.dto.FacultyActivityBulkRequestDto requestDto, org.springframework.security.core.Authentication authentication) {
        System.out.println("BULK CREATE RECEIVED: " + requestDto);
        java.util.UUID facultyId = null;
        if (authentication != null && authentication.getPrincipal() instanceof com.acronexus.security.UserDetailsImpl) {
            com.acronexus.security.UserDetailsImpl userDetails = (com.acronexus.security.UserDetailsImpl) authentication.getPrincipal();
            facultyId = userDetails.getId();
        } else {
            facultyId = java.util.UUID.fromString("284773ac-9882-4c51-8c49-8b584ebb8cfe"); // Default mock for testing
        }
        List<FacultyActivityResponseDto> created = service.bulkCreate(requestDto, facultyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("FacultyActivities bulk created successfully", created));
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.AttendanceSessionRepository debugSessionRepo;

    @GetMapping("/debug/sessions")
    public ResponseEntity<List<java.util.Map<String, Object>>> debugSessions() {
        List<com.acronexus.entity.AttendanceSession> sessions = debugSessionRepo.findAll();
        List<java.util.Map<String, Object>> result = sessions.stream().map(s -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("sessionId", s.getId());
            map.put("code", s.getCode());
            map.put("classSubjectId", s.getClassSubject() != null ? s.getClassSubject().getId() : null);
            return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.ClassSubjectRepository debugCsRepo;

    @GetMapping("/debug/class-subjects")
    public ResponseEntity<List<java.util.Map<String, Object>>> debugClassSubjects() {
        List<com.acronexus.entity.ClassSubject> subjects = debugCsRepo.findAll();
        List<java.util.Map<String, Object>> result = subjects.stream().map(s -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("classSubjectId", s.getId());
            map.put("facultyId", s.getFaculty() != null ? s.getFaculty().getId() : null);
            return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/debug-test-bulk")
    public ResponseEntity<?> debugTestBulk() {
        com.acronexus.dto.FacultyActivityBulkRequestDto req = new com.acronexus.dto.FacultyActivityBulkRequestDto();
        java.util.List<com.acronexus.dto.FacultyActivityRequestDto> list = new java.util.ArrayList<>();
        
        com.acronexus.dto.FacultyActivityRequestDto d1 = new com.acronexus.dto.FacultyActivityRequestDto();
        d1.setClassSubjectId(java.util.UUID.fromString("44e8a693-b9e9-47e5-86e8-627ec4391821"));
        d1.setDate(java.time.LocalDate.parse("2026-08-05"));
        d1.setStatus("ABSENT");
        d1.setReason("Test 1");
        
        com.acronexus.dto.FacultyActivityRequestDto d2 = new com.acronexus.dto.FacultyActivityRequestDto();
        d2.setClassSubjectId(java.util.UUID.fromString("069d141c-dcd6-4dd3-877a-5d5899f16e98"));
        d2.setDate(java.time.LocalDate.parse("2026-08-05"));
        d2.setStatus("ABSENT");
        d2.setReason("Test 2");
        
        list.add(d1);
        list.add(d2);
        req.setActivities(list);
        
        // Use a known faculty ID
        java.util.UUID facultyId = java.util.UUID.fromString("284773ac-9882-4c51-8c49-8b584ebb8cfe");
        
        return ResponseEntity.ok(service.bulkCreate(req, facultyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FacultyActivityResponseDto>> getById(@PathVariable UUID id) {
        FacultyActivityResponseDto responseDto = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("FacultyActivity fetched successfully", responseDto));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FacultyActivityResponseDto>>> getAll() {
        List<FacultyActivityResponseDto> list = service.getAll();
        return ResponseEntity.ok(ApiResponse.success("FacultyActivitys fetched successfully", list));
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<ApiResponse<List<FacultyActivityResponseDto>>> getByFacultyId(@PathVariable UUID facultyId) {
        List<FacultyActivityResponseDto> list = service.getByFacultyId(facultyId);
        return ResponseEntity.ok(ApiResponse.success("Faculty activities fetched successfully", list));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FacultyActivityResponseDto>> update(@PathVariable UUID id, @Valid @RequestBody FacultyActivityRequestDto requestDto) {
        FacultyActivityResponseDto updated = service.update(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success("FacultyActivity updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("FacultyActivity deleted successfully", null));
    }
}
