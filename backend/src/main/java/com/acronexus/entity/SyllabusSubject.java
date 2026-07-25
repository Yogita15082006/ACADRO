package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.List;

@Entity
@Table(name = "syllabus_subjects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SyllabusSubject extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_syllabus_id", nullable = false)
    private AcademicSyllabus academicSyllabus;

    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private Integer theoryHours;
    private Integer practicalHours;
    private String type; // Theory, Practical, Elective

    @Column(columnDefinition = "TEXT")
    private String rawContent;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> unitTitles;
}
