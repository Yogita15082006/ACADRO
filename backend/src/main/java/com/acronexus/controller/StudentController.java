package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.StudentRequestDto;
import com.acronexus.dto.StudentResponseDto;
import com.acronexus.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StudentResponseDto>>> getAllStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String batch,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String status,
            @org.springframework.data.web.PageableDefault(size = 2000) Pageable pageable) {

        return ResponseEntity.ok(ApiResponse.success("Students retrieved successfully", studentService.getAllStudents(search, batch, className, status, pageable)));
    }

    @GetMapping("/batches")
    public ResponseEntity<ApiResponse<List<String>>> getBatches() {
        return ResponseEntity.ok(ApiResponse.success("Batches retrieved successfully", studentService.getBatches()));
    }

    @GetMapping("/classes")
    public ResponseEntity<ApiResponse<List<String>>> getClasses() {
        return ResponseEntity.ok(ApiResponse.success("Classes retrieved successfully", studentService.getClasses()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudentResponseDto>> createStudent(@Valid @RequestBody StudentRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student created successfully", studentService.createStudent(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentResponseDto>> updateStudent(@PathVariable UUID id, @Valid @RequestBody StudentRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Student updated successfully", studentService.updateStudent(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable UUID id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.success("Student deleted successfully", null));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllStudents() {
        studentService.deleteAllStudents();
        return ResponseEntity.ok(ApiResponse.success("All student records deleted successfully", null));
    }
}
