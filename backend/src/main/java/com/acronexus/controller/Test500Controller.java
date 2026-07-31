package com.acronexus.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import com.acronexus.service.CoordinatorAssignmentService;
import com.acronexus.dto.CoordinatorAssignmentRequestDto;
import java.util.UUID;
import org.springframework.http.ResponseEntity;

@RestController
public class Test500Controller {

    @Autowired
    private CoordinatorAssignmentService service;
    
    @Autowired
    private com.acronexus.repository.UserRepository userRepository;

    @GetMapping("/api/v1/test-500")
    public ResponseEntity<?> testError() {
        try {
            // Get any faculty user
            var users = userRepository.findAll();
            if (users.isEmpty()) return ResponseEntity.ok("No users found");
            
            var user = users.stream().filter(u -> u.getRole() == com.acronexus.entity.UserRole.FACULTY).findFirst().orElse(users.get(0));
            
            CoordinatorAssignmentRequestDto req = new CoordinatorAssignmentRequestDto();
            req.setFacultyId(user.getId());
            
            CoordinatorAssignmentRequestDto.AssignmentDetail d = new CoordinatorAssignmentRequestDto.AssignmentDetail();
            d.setClassName("Test");
            d.setAcademicYear("1");
            d.setBatch("B1");
            d.setSemester("1");
            req.setAssignments(java.util.List.of(d));
            
            service.create(req);
            
            return ResponseEntity.ok("Success!");
        } catch (Exception e) {
            e.printStackTrace();
            String trace = java.util.Arrays.stream(e.getStackTrace()).map(StackTraceElement::toString).collect(java.util.stream.Collectors.joining("\n"));
            return ResponseEntity.badRequest().body("Error: " + e.getMessage() + "\n" + trace);
        }
    }
}
