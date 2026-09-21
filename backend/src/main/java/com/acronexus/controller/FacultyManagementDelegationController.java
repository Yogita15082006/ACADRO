package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.FacultyManagementDelegationRequestDto;
import com.acronexus.dto.FacultyManagementDelegationResponseDto;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.FacultyManagementDelegationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/faculty-delegations")
@RequiredArgsConstructor
public class FacultyManagementDelegationController {

    private final FacultyManagementDelegationService delegationService;

    @PostMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<FacultyManagementDelegationResponseDto>> createDelegation(
            @RequestBody FacultyManagementDelegationRequestDto request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                "Task delegated successfully",
                delegationService.createDelegation(request, userDetails.getId())));
    }

    @GetMapping("/hod")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<List<FacultyManagementDelegationResponseDto>>> getDelegationsByHod(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                "Delegated tasks retrieved",
                delegationService.getDelegationsByHod(userDetails.getId())));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<FacultyManagementDelegationResponseDto>>> getActiveDelegationsForFaculty(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                "Active tasks retrieved",
                delegationService.getActiveDelegationsForFaculty(userDetails.getId())));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<FacultyManagementDelegationResponseDto>> completeDelegation(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                "Task completed",
                delegationService.completeDelegation(id, userDetails.getId())));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<FacultyManagementDelegationResponseDto>> revokeDelegation(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                "Task revoked",
                delegationService.revokeDelegation(id, userDetails.getId())));
    }
}
