package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.ExamCapabilitiesDto;
import com.acronexus.dto.ExamCoordinatorAssignmentRequestDto;
import com.acronexus.dto.ExamCoordinatorAssignmentResponseDto;
import com.acronexus.dto.UserResponseDto;
import com.acronexus.service.ExamCoordinatorAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/exam-coordinator-assignments")
@RequiredArgsConstructor
public class ExamCoordinatorAssignmentController {

    private final ExamCoordinatorAssignmentService service;

    @PostMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<ExamCoordinatorAssignmentResponseDto>> assignCoordinator(@Valid @RequestBody ExamCoordinatorAssignmentRequestDto requestDto) {
        ExamCoordinatorAssignmentResponseDto dto = service.assignCoordinator(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Exam coordinator assigned successfully", dto));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<Void>> revokeAssignment(@PathVariable UUID id) {
        service.revokeAssignment(id);
        return ResponseEntity.ok(ApiResponse.success("Assignment revoked successfully", null));
    }

    @GetMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<List<ExamCoordinatorAssignmentResponseDto>>> getDepartmentAssignments() {
        return ResponseEntity.ok(ApiResponse.success("Assignments fetched successfully", service.getDepartmentAssignments()));
    }

    @GetMapping("/my-active")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<ExamCoordinatorAssignmentResponseDto>>> getMyActiveAssignments() {
        return ResponseEntity.ok(ApiResponse.success("Active assignments fetched successfully", service.getMyActiveAssignments()));
    }

    @GetMapping("/eligible-faculty")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getEligibleFaculty() {
        return ResponseEntity.ok(ApiResponse.success("Eligible faculty fetched successfully", service.getEligibleFaculty()));
    }

    @GetMapping("/capabilities")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<ExamCapabilitiesDto>> getMyCapabilities() {
        return ResponseEntity.ok(ApiResponse.success("Capabilities fetched successfully", service.getMyCapabilities()));
    }
}
