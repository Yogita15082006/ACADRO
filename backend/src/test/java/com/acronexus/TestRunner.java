package com.acronexus;

import com.acronexus.service.impl.AttendanceDashboardServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.util.UUID;

@SpringBootTest
public class TestRunner {
    
    @Autowired
    private AttendanceDashboardServiceImpl service;
    
    @Test
    public void testGetStudentSubjectWiseAttendance() {
        UUID studentId = UUID.fromString("ad19bf82-026b-4fac-a378-571831cb99d7");
        var result = service.getStudentSubjectWiseAttendance(studentId);
        var overall = service.getStudentOverallAttendance(studentId);
        System.out.println("================= TEST OUTPUT =================");
        System.out.println("Student Profile:");
        System.out.println("Name: " + overall.getStudentName());
        System.out.println("Email: " + overall.getEmail());
        System.out.println("Semester: " + overall.getSemester());
        System.out.println("Class: " + overall.getClassName());
        System.out.println("Photo: " + overall.getProfilePictureUrl());
        System.out.println("Total Subjects Returned: " + result.size());
        for (var dto : result) {
            System.out.println(dto.getSubjectName() + " - " + dto.getFacultyName() + " - Total: " + dto.getTotalClasses());
        }
        System.out.println("===============================================");
    }
}
