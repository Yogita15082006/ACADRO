package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "academic_records")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AcademicRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false, length = 50)
    private String educationLevel;

    @Column(nullable = false, length = 255)
    private String institutionName;

    @Column(nullable = false)
    private Integer passingYear;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal percentage;

    @Column(length = 500)
    private String documentUrl;

    @Column(length = 100)
    private String boardName;
}
