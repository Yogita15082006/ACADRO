package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.service.HodTransferService;
import com.acronexus.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/hod-assignments")
@RequiredArgsConstructor
public class HodAssignmentController {

    private final HodTransferService hodTransferService;
    private final DepartmentRepository departmentRepository;

    @PutMapping("/{targetUserId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HOD')")
    public ResponseEntity<ApiResponse<Void>> assignHod(
            @PathVariable UUID targetUserId,
            @RequestBody List<String> selectedDeptNames) {
        
        List<UUID> selectedDeptIds = selectedDeptNames.stream()
                .map(name -> departmentRepository.findByNameIgnoreCase(name)
                        .orElseThrow(() -> new RuntimeException("Department not found: " + name))
                        .getId())
                .collect(Collectors.toList());

        hodTransferService.assignHod(targetUserId, selectedDeptIds);
        return ResponseEntity.ok(ApiResponse.success("HOD assignments updated successfully", null));
    }

    @GetMapping("/{targetUserId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HOD')")
    public ResponseEntity<ApiResponse<List<String>>> getHodAssignments(
            @PathVariable UUID targetUserId) {
        List<String> deptNames = departmentRepository.findByHodId(targetUserId)
                                                 .stream()
                                                 .map(com.acronexus.entity.Department::getName)
                                                 .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("HOD assignments fetched", deptNames));
    }
}
