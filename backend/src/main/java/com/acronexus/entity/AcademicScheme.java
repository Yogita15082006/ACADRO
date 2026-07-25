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

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "file_storage_id", nullable = false)
    private FileStorage fileStorage;
}
