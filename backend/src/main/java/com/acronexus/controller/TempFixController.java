package com.acronexus.controller;

import com.acronexus.entity.*;
import com.acronexus.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@RestController
@RequestMapping("/api/v1/temp-fix")
public class TempFixController {

    @Autowired private AcroClassRepository acroClassRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private StudentEnrollmentRepository studentEnrollmentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BulkUploadRepository bulkUploadRepository;

    @GetMapping
    @Transactional
    public String fixAll() {
        // 1. Wipe all student enrollments
        studentEnrollmentRepository.deleteAll();
        
        // 2. Wipe all students
        studentRepository.deleteAll();
        
        // 3. Wipe all users who are students
        List<User> students = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.STUDENT)
            .toList();
        userRepository.deleteAll(students);
        
        // 4. Wipe all classes so they get recreated fresh based on the new logic
        acroClassRepository.deleteAll();
        
        // 5. Wipe bulk uploads to reset history
        bulkUploadRepository.deleteAll();

        return "Successfully wiped all student and class data. Ready for fresh import.";
    }
}
