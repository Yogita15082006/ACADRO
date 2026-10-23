package com.acronexus.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "faculties")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Faculty implements Persistable<java.util.UUID> {
    @Id
    @Column(name = "user_id")
    private java.util.UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(unique = true, nullable = false)
    private String employeeId;
    
    private String designation;
    private LocalDate joiningDate;
    private String qualification;
    
    @Column(name = "experience_years")
    private Integer experienceYears;
    
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "expertise_areas")
    private List<String> expertiseAreas;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "faculty_departments",
        joinColumns = @JoinColumn(name = "faculty_id"),
        inverseJoinColumns = @JoinColumn(name = "department_id")
    )
    private List<Department> departments;

    // 1. Personal & Employment Details
    @Column(name = "employment_type")
    private String employmentType;
    
    @Column(name = "pan")
    private String pan;
    
    @Column(name = "aicte_id")
    private String aicteId;
    
    @Column(name = "rgpv_id")
    private String rgpvId;
    
    @Column(name = "highest_qualification")
    private String highestQualification;
    
    @Column(name = "has_phd")
    private Boolean hasPhd;
    
    @Column(name = "phd_university")
    private String phdUniversity;
    
    @Column(name = "phd_award_date")
    private LocalDate phdAwardDate;
    
    @Column(name = "pg_detail")
    private String pgDetail;
    
    @Column(name = "pg_specialization")
    private String pgSpecialization;
    
    @Column(name = "pg_university")
    private String pgUniversity;
    
    @Column(name = "pg_year")
    private Integer pgYear;
    
    @Column(name = "ug_detail")
    private String ugDetail;
    
    @Column(name = "ug_specialization")
    private String ugSpecialization;
    
    @Column(name = "ug_university")
    private String ugUniversity;
    
    @Column(name = "ug_year")
    private Integer ugYear;
    
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    // 2. Teaching Experience & Retention Details
    @Column(name = "teaching_experience_years")
    private Double teachingExperienceYears;
    
    @Column(name = "industry_experience_years")
    private Double industryExperienceYears;
    
    @Column(name = "aitr_service_years")
    private Double aitrServiceYears;
    
    @Column(name = "current_designation_since")
    private LocalDate currentDesignationSince;
    
    @Column(name = "previous_institute")
    private String previousInstitute;
    
    @Column(name = "retention_category")
    private String retentionCategory;

    // 4. Research & Publications summary counts & identifiers
    @Column(name = "sci_count")
    private Integer sciCount;
    
    @Column(name = "scopus_count")
    private Integer scopusCount;
    
    @Column(name = "ugc_count")
    private Integer ugcCount;
    
    @Column(name = "books_count")
    private Integer booksCount;
    
    @Column(name = "book_chapters_count")
    private Integer bookChaptersCount;
    
    @Column(name = "patents_count")
    private Integer patentsCount;
    
    @Column(name = "projects_count")
    private Integer projectsCount;
    
    @Column(name = "consultancy_count")
    private Integer consultancyCount;
    
    @Column(name = "google_scholar_id")
    private String googleScholarId;
    
    @Column(name = "orcid_id")
    private String orcidId;
    
    @Column(name = "scopus_id")
    private String scopusId;

    // 6. Workload & Responsibilities
    @Column(name = "theory_load_hours")
    private Integer theoryLoadHours;
    
    @Column(name = "lab_load_hours")
    private Integer labLoadHours;
    
    @Column(name = "project_guide_details", columnDefinition = "TEXT")
    private String projectGuideDetails;
    
    @Column(name = "mentoring_details", columnDefinition = "TEXT")
    private String mentoringDetails;
    
    @Column(name = "admin_duties", columnDefinition = "TEXT")
    private String adminDuties;

    // Supporting Documents JSONB
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "faculty_documents", columnDefinition = "jsonb")
    private java.util.Map<String, Object> facultyDocuments;

    // Transient flag for Persistable support (matches Student entity pattern)
    @Transient
    private boolean isNewEntity = false;

    @Override
    public boolean isNew() {
        return isNewEntity;
    }

    /**
     * Mark this entity as new so that Spring Data uses persist() instead of merge().
     * Required because @MapsId sets the ID from User before save().
     */
    public void markAsNew() {
        this.isNewEntity = true;
    }


    public java.util.UUID getId() {
        return this.id;
    }
    public void setId(java.util.UUID id) {
        this.id = id;
    }

    public User getUser() {
        return this.user;
    }
    public void setUser(User user) {
        this.user = user;
    }

    public String getEmployeeId() {
        return this.employeeId;
    }
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getDesignation() {
        return this.designation;
    }
    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public LocalDate getJoiningDate() {
        return this.joiningDate;
    }
    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }

    public String getQualification() {
        return this.qualification;
    }
    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public Integer getExperienceYears() {
        return this.experienceYears;
    }
    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public List<String> getExpertiseAreas() {
        return this.expertiseAreas;
    }
    public void setExpertiseAreas(List<String> expertiseAreas) {
        this.expertiseAreas = expertiseAreas;
    }

    public boolean getIsNewEntity() {
        return this.isNewEntity;
    }
    public void setIsNewEntity(boolean isNewEntity) {
        this.isNewEntity = isNewEntity;
    }
}