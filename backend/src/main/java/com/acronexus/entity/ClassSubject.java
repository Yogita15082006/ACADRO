package com.acronexus.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "class_subjects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ClassSubject extends BaseAuditableEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private AcroClass acroClass;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id")
    private AcademicYear academicYear;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Boolean isActive = true;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;


    public AcroClass getAcroClass() {
        return this.acroClass;
    }
    public void setAcroClass(AcroClass acroClass) {
        this.acroClass = acroClass;
    }

    public Subject getSubject() {
        return this.subject;
    }
    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Faculty getFaculty() {
        return this.faculty;
    }
    public void setFaculty(Faculty faculty) {
        this.faculty = faculty;
    }

    public AcademicYear getAcademicYear() {
        return this.academicYear;
    }
    public void setAcademicYear(AcademicYear academicYear) {
        this.academicYear = academicYear;
    }

    public Semester getSemester() {
        return this.semester;
    }
    public void setSemester(Semester semester) {
        this.semester = semester;
    }

    public LocalDate getEffectiveFrom() {
        return this.effectiveFrom;
    }
    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return this.effectiveTo;
    }
    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public Boolean getIsActive() {
        return this.isActive;
    }
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public User getCreatedBy() {
        return this.createdBy;
    }
    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }
}