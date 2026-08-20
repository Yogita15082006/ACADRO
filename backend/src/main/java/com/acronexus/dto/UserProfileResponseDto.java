package com.acronexus.dto;

import com.acronexus.entity.BloodGroup;
import com.acronexus.entity.Gender;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class UserProfileResponseDto {
    private UUID id;
    private String email;
    private String role;
    private String firstName;
    private String lastName;
    private String phone;
    private Gender gender;
    private LocalDate dob;
    private BloodGroup bloodGroup;
    private String profilePictureUrl;
    private String departmentName;
    private String department;
    private String branch;
    private java.util.List<java.util.Map<String, Object>> departments;
    
    // Student specific fields
    private String enrollmentNo;
    private String rollNo;
    private String batchYear;
    private String admissionYear;
    private String course;
    private String currentSemester;
    private String section;
}
