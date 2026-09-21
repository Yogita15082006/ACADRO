package com.acronexus.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "student_enrollments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StudentEnrollment extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id")
    private AcademicYear academicYear;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private AcroClass acroClass;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    @Column(precision = 4, scale = 2)
    private java.math.BigDecimal sgpa;
    
    @Column(precision = 4, scale = 2)
    private java.math.BigDecimal cgpa;
    
    @Column(name = "study_year")
    private Integer studyYear;
    
    private Boolean isActive = true;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}