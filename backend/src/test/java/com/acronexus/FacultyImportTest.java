package com.acronexus;

import com.acronexus.dto.BulkUploadResponseDto;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.repository.UserRepository;
import com.acronexus.service.FacultyBulkUploadService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SpringBootTest
public class FacultyImportTest {

    @Autowired
    private FacultyBulkUploadService facultyBulkUploadService;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testFacultyImport() {
        System.out.println("=== STARTING FACULTY IMPORT TEST ===");
        
        User uploader = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.HOD || u.getRole() == UserRole.FACULTY)
            .findFirst()
            .orElseGet(() -> {
                User u = new User();
                u.setEmail("testadmin@acropolis.in");
                u.setFirstName("Test");
                u.setLastName("Admin");
                u.setPasswordHash("hash");
                u.setRole(UserRole.HOD);
                return userRepository.save(u);
            });

        List<Map<String, String>> records = new ArrayList<>();
        Map<String, String> row1 = new HashMap<>();
        row1.put("facultyName", "Test Faculty One");
        row1.put("employeeId", "TEST_EMP_001");
        row1.put("collegeEmail", "test.faculty1@acropolis.in");
        row1.put("gender", "MALE");
        row1.put("role", "Assistant Professor");
        row1.put("department", "Information Technology");
        row1.put("mobileNumber", "9999999991");
        row1.put("joiningDate", "2020-01-15");
        row1.put("qualification", "Ph.D.");
        row1.put("experience", "10 Years");
        row1.put("status", "ACTIVE");
        records.add(row1);

        Map<String, String> row2 = new HashMap<>();
        row2.put("facultyName", "Test Faculty Two");
        row2.put("employeeId", "TEST_EMP_002");
        row2.put("collegeEmail", "test.faculty2@acropolis.in");
        row2.put("gender", "FEMALE");
        row2.put("role", "Head of Department");
        row2.put("department", "Computer Science");
        row2.put("mobileNumber", "9999999992");
        row2.put("joiningDate", "2018-05-20");
        row2.put("qualification", "M.Tech");
        row2.put("experience", "15.5");
        row2.put("status", "ACTIVE");
        records.add(row2);

        List<Map<String, Object>> inputRecords = new ArrayList<>();
        records.forEach(r -> inputRecords.add(new HashMap<>(r)));

        try {
            BulkUploadResponseDto response = facultyBulkUploadService.importValidatedFaculties(inputRecords, uploader.getId());
            System.out.println("TEST IMPORT COMPLETED!");
            System.out.println("Total Uploaded: " + response.getTotalRecords());
            System.out.println("Successful: " + response.getSuccessfullyInserted());
            System.out.println("Failed: " + response.getFailedRecords());
            if (response.getErrorLog() != null) {
                response.getErrorLog().forEach(e -> {
                    System.out.println("Error at row " + e.getRowNumber() + ": " + e.getErrorMessage());
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
