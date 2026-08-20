package com.acronexus.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class StudentResponseDto {
    private UUID id;
    private UUID userId;
    private String enrollmentNumber;
    private String name;
    private String gender;
    private String batch;
    private String year;
    private String semester;
    private String course;
    private String section;
    private String className;
    private String status;
    private String avatar;
    private String email;
    private String phone;
    private String department;
    private String departmentName;
    private String branch;
    private String rollNo;
    private String admissionYear;
    private String instituteEnrollment;
    private String currentSemester;
    private String batchYear;
    private String personalEmail;
    private String collegeEmail;
    private String whatsappNumber;
    private String dob;
    private String category;
    private String religion;
    private String nationality;
    private String residenceType;
    private String bloodGroup;
    private String hobbies;
    private String clubs;
}
