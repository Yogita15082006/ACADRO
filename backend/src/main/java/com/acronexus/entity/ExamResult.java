package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_results")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ExamResult extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_id", nullable = false)
    private Examination examination;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal marksObtained;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal maxMarks;

    @Column(length = 5)
    private String grade;

    @Column(columnDefinition = "TEXT")
    private String remarks;
    
    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean isPublished = false;

    @Column(name = "class_name", length = 100)
    private String className;

}
