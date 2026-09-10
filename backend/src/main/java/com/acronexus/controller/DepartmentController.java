package com.acronexus.controller;

import com.acronexus.entity.Department;
import com.acronexus.entity.User;
import com.acronexus.repository.DepartmentRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import com.acronexus.dto.ApiResponse;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<Department>>> getAllDepartments() {
        return ResponseEntity.ok(ApiResponse.success("Departments retrieved successfully", departmentRepository.findAll()));
    }

    @GetMapping("/hod")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Department>>> getHodDepartments(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                
        if (isAdmin) {
            return ResponseEntity.ok(ApiResponse.success("Admin Departments retrieved successfully", departmentRepository.findAll()));
        }
        
        List<Department> hodDepartments = departmentRepository.findByHodId(userDetails.getId());
        if (hodDepartments.isEmpty()) {
            User user = userRepository.findById(userDetails.getId()).orElse(null);
            if (user != null && user.getDepartment() != null) {
                hodDepartments = List.of(user.getDepartment());
            } else {
                hodDepartments = departmentRepository.findAll();
            }
        }
        return ResponseEntity.ok(ApiResponse.success("HOD Departments retrieved successfully", hodDepartments));
    }
}
