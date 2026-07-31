package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "academic_scheme")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AcademicScheme extends BaseEntity {

    private String batch;
    private String className;
    private String academicYear;
    private String semester;
    private String schemeName;
    private String department;
    private String degree;
    @Column(length = 2000)
    private String description;
    @Column(length = 2000)
    private String eligibility;
    private String benefits;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "file_storage_id", nullable = false)
    private FileStorage fileStorage;
}
