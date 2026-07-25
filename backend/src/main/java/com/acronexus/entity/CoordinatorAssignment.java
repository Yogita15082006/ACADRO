package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "coordinator_assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CoordinatorAssignment extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coordinator_id", nullable = false)
    private User coordinator;

    @Column(name = "class_name")
    private String className;

    private String batch;

    @Column(name = "academic_year")
    private String academicYear;

    private String semester;

    @Column(nullable = false)
    private java.time.LocalDate effectiveFrom;

    private java.time.LocalDate effectiveTo;

    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

}
