package com.acronexus.entity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "students")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Student implements Persistable<java.util.UUID> {
    @Id
    @Column(name = "user_id")
    private java.util.UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(unique = true, nullable = false)
    private String enrollmentNo;
    
    private String rollNo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "degree_program_id")
    private DegreeProgram degreeProgram;
    
    @Column(nullable = false)
    private String batchYear;

    @Column(name = "institute_enrollment")
    private String instituteEnrollment;
    
    @Column(name = "admission_year")
    private String admissionYear;
    
    private String course;
    
    @Column(name = "current_semester")
    private String currentSemester;
    
    private String section;
    
    @Column(name = "technical_skills")
    private String technicalSkills;
    
    @Column(name = "soft_skills")
    private String softSkills;
    
    private String hobbies;
    private String clubs;
    
    // Professional Details
    @Column(name = "linkedin")
    private String linkedin;

    @Column(name = "github")
    private String github;

    @Column(name = "portfolio")
    private String portfolio;

    @Column(name = "leetcode")
    private String leetcode;

    @Column(name = "hackerrank")
    private String hackerrank;

    @Column(name = "domains")
    private String domains;

    @Column(name = "job_preferences")
    private String jobPreferences;

    @Column(name = "relocation")
    private String relocation;

    @Column(name = "resume_file_name")
    private String resumeFileName;

    @Column(name = "resume_uploaded_at")
    private String resumeUploadedAt;
    
    @Column(name = "resume_url")
    private String resumeUrl;

    // Academic Stats
    @Column(name = "active_backlogs")
    private Integer activeBacklogs;

    @Column(name = "history_backlogs")
    private Integer historyBacklogs;

    @Column(name = "study_gap")
    private Integer studyGap;

    @Column(name = "batch_coordinator")
    private String batchCoordinator;

    @Column(precision = 4, scale = 2)
    private java.math.BigDecimal cgpa;

    @Column(name = "current_subjects")
    private String currentSubjects;

    // SGPA for 8 semesters
    @Column(precision = 4, scale = 2) private java.math.BigDecimal sgpaSem1;
    @Column(precision = 4, scale = 2) private java.math.BigDecimal sgpaSem2;
    @Column(precision = 4, scale = 2) private java.math.BigDecimal sgpaSem3;
    @Column(precision = 4, scale = 2) private java.math.BigDecimal sgpaSem4;
    @Column(precision = 4, scale = 2) private java.math.BigDecimal sgpaSem5;
    @Column(precision = 4, scale = 2) private java.math.BigDecimal sgpaSem6;
    @Column(precision = 4, scale = 2) private java.math.BigDecimal sgpaSem7;
    @Column(precision = 4, scale = 2) private java.math.BigDecimal sgpaSem8;

    // Marksheet URLs for 8 semesters
    @Column(name = "marksheet_url_sem1") private String marksheetUrlSem1;
    @Column(name = "marksheet_url_sem2") private String marksheetUrlSem2;
    @Column(name = "marksheet_url_sem3") private String marksheetUrlSem3;
    @Column(name = "marksheet_url_sem4") private String marksheetUrlSem4;
    @Column(name = "marksheet_url_sem5") private String marksheetUrlSem5;
    @Column(name = "marksheet_url_sem6") private String marksheetUrlSem6;
    @Column(name = "marksheet_url_sem7") private String marksheetUrlSem7;
    @Column(name = "marksheet_url_sem8") private String marksheetUrlSem8;

    // Transient flag for Persistable support
    @Transient
    private boolean isNewEntity = false;

    @Override
    public boolean isNew() {
        return isNewEntity;
    }

    /**
     * Mark this entity as new so that Spring Data uses persist() instead of merge().
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

    public String getEnrollmentNo() {
        return this.enrollmentNo;
    }
    public void setEnrollmentNo(String enrollmentNo) {
        this.enrollmentNo = enrollmentNo;
    }

    public String getRollNo() {
        return this.rollNo;
    }
    public void setRollNo(String rollNo) {
        this.rollNo = rollNo;
    }

    public DegreeProgram getDegreeProgram() {
        return this.degreeProgram;
    }
    public void setDegreeProgram(DegreeProgram degreeProgram) {
        this.degreeProgram = degreeProgram;
    }

    public String getBatchYear() {
        return this.batchYear;
    }
    public void setBatchYear(String batchYear) {
        this.batchYear = batchYear;
    }

    public String getInstituteEnrollment() {
        return this.instituteEnrollment;
    }
    public void setInstituteEnrollment(String instituteEnrollment) {
        this.instituteEnrollment = instituteEnrollment;
    }

    public String getAdmissionYear() {
        return this.admissionYear;
    }
    public void setAdmissionYear(String admissionYear) {
        this.admissionYear = admissionYear;
    }

    public String getCourse() {
        return this.course;
    }
    public void setCourse(String course) {
        this.course = course;
    }

    public String getCurrentSemester() {
        return this.currentSemester;
    }
    public void setCurrentSemester(String currentSemester) {
        this.currentSemester = currentSemester;
    }

    public String getSection() {
        return this.section;
    }
    public void setSection(String section) {
        this.section = section;
    }

    public String getTechnicalSkills() {
        return this.technicalSkills;
    }
    public void setTechnicalSkills(String technicalSkills) {
        this.technicalSkills = technicalSkills;
    }

    public String getSoftSkills() {
        return this.softSkills;
    }
    public void setSoftSkills(String softSkills) {
        this.softSkills = softSkills;
    }

    public String getHobbies() {
        return this.hobbies;
    }
    public void setHobbies(String hobbies) {
        this.hobbies = hobbies;
    }

    public String getClubs() {
        return this.clubs;
    }
    public void setClubs(String clubs) {
        this.clubs = clubs;
    }

    public String getLinkedin() {
        return this.linkedin;
    }
    public void setLinkedin(String linkedin) {
        this.linkedin = linkedin;
    }

    public String getGithub() {
        return this.github;
    }
    public void setGithub(String github) {
        this.github = github;
    }

    public String getPortfolio() {
        return this.portfolio;
    }
    public void setPortfolio(String portfolio) {
        this.portfolio = portfolio;
    }

    public String getLeetcode() {
        return this.leetcode;
    }
    public void setLeetcode(String leetcode) {
        this.leetcode = leetcode;
    }

    public String getHackerrank() {
        return this.hackerrank;
    }
    public void setHackerrank(String hackerrank) {
        this.hackerrank = hackerrank;
    }

    public String getDomains() {
        return this.domains;
    }
    public void setDomains(String domains) {
        this.domains = domains;
    }

    public String getJobPreferences() {
        return this.jobPreferences;
    }
    public void setJobPreferences(String jobPreferences) {
        this.jobPreferences = jobPreferences;
    }

    public String getRelocation() {
        return this.relocation;
    }
    public void setRelocation(String relocation) {
        this.relocation = relocation;
    }

    public String getResumeFileName() {
        return this.resumeFileName;
    }
    public void setResumeFileName(String resumeFileName) {
        this.resumeFileName = resumeFileName;
    }

    public String getResumeUploadedAt() {
        return this.resumeUploadedAt;
    }
    public void setResumeUploadedAt(String resumeUploadedAt) {
        this.resumeUploadedAt = resumeUploadedAt;
    }

    public String getResumeUrl() {
        return this.resumeUrl;
    }

    public void setResumeUrl(String resumeUrl) {
        this.resumeUrl = resumeUrl;
    }

    public Integer getActiveBacklogs() {
        return this.activeBacklogs;
    }
    public void setActiveBacklogs(Integer activeBacklogs) {
        this.activeBacklogs = activeBacklogs;
    }

    public Integer getHistoryBacklogs() {
        return this.historyBacklogs;
    }
    public void setHistoryBacklogs(Integer historyBacklogs) {
        this.historyBacklogs = historyBacklogs;
    }

    public Integer getStudyGap() {
        return this.studyGap;
    }
    public void setStudyGap(Integer studyGap) {
        this.studyGap = studyGap;
    }

    public String getBatchCoordinator() {
        return this.batchCoordinator;
    }
    public void setBatchCoordinator(String batchCoordinator) {
        this.batchCoordinator = batchCoordinator;
    }

    public java.math.BigDecimal getCgpa() {
        return this.cgpa;
    }
    public void setCgpa(java.math.BigDecimal cgpa) {
        this.cgpa = cgpa;
    }

    public String getCurrentSubjects() {
        return this.currentSubjects;
    }
    public void setCurrentSubjects(String currentSubjects) {
        this.currentSubjects = currentSubjects;
    }

    public java.math.BigDecimal getSgpaSem1() {
        return this.sgpaSem1;
    }
    public void setSgpaSem1(java.math.BigDecimal sgpaSem1) {
        this.sgpaSem1 = sgpaSem1;
    }

    public java.math.BigDecimal getSgpaSem2() {
        return this.sgpaSem2;
    }
    public void setSgpaSem2(java.math.BigDecimal sgpaSem2) {
        this.sgpaSem2 = sgpaSem2;
    }

    public java.math.BigDecimal getSgpaSem3() {
        return this.sgpaSem3;
    }
    public void setSgpaSem3(java.math.BigDecimal sgpaSem3) {
        this.sgpaSem3 = sgpaSem3;
    }

    public java.math.BigDecimal getSgpaSem4() {
        return this.sgpaSem4;
    }
    public void setSgpaSem4(java.math.BigDecimal sgpaSem4) {
        this.sgpaSem4 = sgpaSem4;
    }

    public java.math.BigDecimal getSgpaSem5() {
        return this.sgpaSem5;
    }
    public void setSgpaSem5(java.math.BigDecimal sgpaSem5) {
        this.sgpaSem5 = sgpaSem5;
    }

    public java.math.BigDecimal getSgpaSem6() {
        return this.sgpaSem6;
    }
    public void setSgpaSem6(java.math.BigDecimal sgpaSem6) {
        this.sgpaSem6 = sgpaSem6;
    }

    public java.math.BigDecimal getSgpaSem7() {
        return this.sgpaSem7;
    }
    public void setSgpaSem7(java.math.BigDecimal sgpaSem7) {
        this.sgpaSem7 = sgpaSem7;
    }

    public java.math.BigDecimal getSgpaSem8() {
        return this.sgpaSem8;
    }
    public void setSgpaSem8(java.math.BigDecimal sgpaSem8) {
        this.sgpaSem8 = sgpaSem8;
    }

    public boolean getIsNewEntity() {
        return this.isNewEntity;
    }
    public void setIsNewEntity(boolean isNewEntity) {
        this.isNewEntity = isNewEntity;
    }
}