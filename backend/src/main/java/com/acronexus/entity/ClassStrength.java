package com.acronexus.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "class_strengths", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"class_id", "semester_id", "academic_year_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClassStrength extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private AcroClass acroClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id")
    private AcademicYear academicYear;

    @Column(name = "sanctioned_intake")
    private Integer sanctionedIntake;

    @Column(name = "lateral_entry_count")
    private Integer lateralEntryCount;

    @Column(name = "supernumerary_count")
    private Integer supernumeraryCount;

    @Column(name = "detained_count")
    private Integer detainedCount;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
