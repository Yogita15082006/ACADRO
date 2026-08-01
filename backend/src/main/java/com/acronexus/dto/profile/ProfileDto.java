package com.acronexus.dto.profile;

import com.acronexus.entity.BloodGroup;
import com.acronexus.entity.Gender;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProfileDto {
    // Base User Details
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

    // New User Details
    private String category;
    private String nationality;
    private String religion;
    private String aadhaarNumber;
    private String residenceType;
    private String whatsappNumber;
    private String personalEmail;
    private String collegeEmail;

    // Base Student Details
    private String enrollmentNo;
    private String rollNo;
    private String batchYear;
    private String admissionYear;

    // New Student Details
    private String instituteEnrollment;
    private String course;
    private String currentSemester;
    private String section;
    private List<String> skills;
    private String hobbies;
    private String clubs;

    // Professional Details
    private String linkedin;
    private String github;
    private String portfolio;
    private String leetcode;
    private String hackerrank;
    private List<String> domains;
    private String jobPreferences;
    private String relocation;
    private String resumeFileName;
    private String resumeUploadedAt;

    // Academic Stats
    private Integer activeBacklogs;
    private Integer historyBacklogs;
    private Integer studyGap;
    private String batchCoordinator;
    private java.math.BigDecimal cgpa;
    private List<String> subjects;
    private SgpaDto sgpa;

    // Academic Records (10th & 12th)
    private String tenthSchoolName;
    private String tenthBoard;
    private String tenthPercentage;
    private String tenthYear;
    
    private String twelfthSchoolName;
    private String twelfthBoard;
    private String twelfthPercentage;
    private String twelfthYear;

    // Complex Objects
    private FamilyDetailsDto familyDetails;
    private AddressDetailsDto addressDetails;
    private List<StudentProjectDto> projects;
    private List<StudentInternshipDto> internships;
    private List<StudentCertificationDto> certifications;
    private List<StudentAchievementDto> achievements;
    private java.util.Map<String, Object> documents;

    @Data
    public static class FamilyDetailsDto {
        private String fatherName;
        private String fatherMobile;
        private String fatherOccupation;
        private String fatherDesignation;
        private String fatherOrganization;
        private String motherName;
        private String motherMobile;
        private String motherOccupation;
        private String motherDesignation;
        private String motherOrganization;
        private String familyStatus;
        private Integer numberOfBrothers;
        private Integer numberOfSisters;
        private String annualIncome;
    }

    @Data
    public static class SgpaDto {
        private java.math.BigDecimal sem1;
        private java.math.BigDecimal sem2;
        private java.math.BigDecimal sem3;
        private java.math.BigDecimal sem4;
        private java.math.BigDecimal sem5;
        private java.math.BigDecimal sem6;
        private java.math.BigDecimal sem7;
        private java.math.BigDecimal sem8;
    }

    @Data
    public static class AddressDetailsDto {
        private String localAddress;
        private String localCity;
        private String localState;
        private String localPincode;
        private String permanentAddress;
        private String permanentCity;
        private String permanentState;
        private String permanentPincode;
    }

    @Data
    public static class StudentProjectDto {
        private UUID id;
        private String title;
        private String description;
        private List<String> techStack;
        private String githubLink;
        private String liveLink;
    }

    @Data
    public static class StudentInternshipDto {
        private UUID id;
        private String role;
        private String company;
        private String mentor;
        private String duration;
        private List<String> technologies;
        private String description;
        private String link;
    }

    @Data
    public static class StudentCertificationDto {
        private UUID id;
        private String title;
        private String issuer;
        private String date;
        private String link;
    }

    @Data
    public static class StudentAchievementDto {
        private UUID id;
        private String title;
        private String category;
        private String date;
        private String description;
        private String link;
    }
}
