package com.acronexus.dto.faculty;

import com.acronexus.dto.response.AssignedSubjectDto;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyProfileDto {
    // Identity & Account
    private UUID id;
    private String employeeId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private UUID departmentId;
    private String departmentName;
    private String profilePictureUrl;

    // 1. Personal & Employment Details
    private String designation;
    private LocalDate joiningDate;
    private String employmentType;
    private String pan; // Masked for coordinators/unauthorized
    private String aicteId;
    private String rgpvId;
    private String highestQualification;
    private Boolean hasPhd;
    private String phdUniversity;
    private LocalDate phdAwardDate;
    private String pgDetail;
    private String pgSpecialization;
    private String pgUniversity;
    private Integer pgYear;
    private String ugDetail;
    private String ugSpecialization;
    private String ugUniversity;
    private Integer ugYear;
    private String remarks;

    // 2. Teaching Experience & Retention Details
    private Double teachingExperienceYears;
    private Double industryExperienceYears;
    private Double aitrServiceYears;
    private LocalDate currentDesignationSince;
    private String previousInstitute;
    private String retentionCategory;

    // 4. Research & Publications summary
    private Integer sciCount;
    private Integer scopusCount;
    private Integer ugcCount;
    private Integer booksCount;
    private Integer bookChaptersCount;
    private Integer patentsCount;
    private Integer projectsCount;
    private Integer consultancyCount;
    private String googleScholarId;
    private String orcidId;
    private String scopusId;

    // 6. Workload & Responsibilities
    private Integer theoryLoadHours;
    private Integer labLoadHours;
    private Integer totalTeachingLoadHours;
    private String projectGuideDetails;
    private String mentoringDetails;
    private String adminDuties;

    // Associated collections
    private List<FacultyPromotionDto> promotions;
    private List<FacultyResearchContributionDto> researchContributions;
    private List<FacultyResourcePersonDto> resourcePersons;
    private List<AssignedSubjectDto> assignedSubjects;
    private Map<String, Object> documents;
}
