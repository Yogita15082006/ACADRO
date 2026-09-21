package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.StudentLoginHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student-login-history")
@RequiredArgsConstructor
public class StudentLoginHistoryController {

    private final StudentLoginHistoryService studentLoginHistoryService;

    /**
     * Returns classes accessible to the logged-in HOD or Coordinator.
     */
    @GetMapping("/classes")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAccessibleClasses() {
        UUID userId = getCurrentUserId();
        List<Map<String, Object>> classes = studentLoginHistoryService.getAccessibleClasses(userId);
        return ResponseEntity.ok(ApiResponse.success("Classes fetched successfully", classes));
    }

    /**
     * Returns login summary for students in the selected class.
     */
    @GetMapping("/class/{classId}/summary")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getClassLoginSummary(@PathVariable String classId) {
        UUID userId = getCurrentUserId();
        List<Map<String, Object>> summary = studentLoginHistoryService.getClassLoginSummary(classId, userId);
        return ResponseEntity.ok(ApiResponse.success("Login summary fetched successfully", summary));
    }

    /**
     * Returns complete login history for an individual student.
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentLoginHistory(@PathVariable UUID studentId) {
        UUID userId = getCurrentUserId();
        Map<String, Object> history = studentLoginHistoryService.getStudentLoginHistory(studentId, userId);
        return ResponseEntity.ok(ApiResponse.success("Student login history fetched successfully", history));
    }

    private UUID getCurrentUserId() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return userDetails.getId();
    }
}
