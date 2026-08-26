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

    // Additional fields for full profile export and edit pre-filling
    private UUID classId;
    private UUID academicYearId;
    private UUID semesterId;

    private java.math.BigDecimal sgpaSem1;
    private java.math.BigDecimal sgpaSem2;
    private java.math.BigDecimal sgpaSem3;
    private java.math.BigDecimal sgpaSem4;
    private java.math.BigDecimal sgpaSem5;
    private java.math.BigDecimal sgpaSem6;
    private java.math.BigDecimal sgpaSem7;
    private java.math.BigDecimal sgpaSem8;
    private java.math.BigDecimal cgpa;
}
