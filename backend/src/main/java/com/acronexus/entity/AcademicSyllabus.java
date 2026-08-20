package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "academic_syllabus")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AcademicSyllabus extends BaseEntity {

    private String batch;
    private String className;
    private String academicYear;
    private String semester;
    private String department;
    private String degree;
    private Integer totalSubjects;
    private String processingStatus;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "file_storage_id", nullable = false)
    private FileStorage fileStorage;

    @OneToMany(mappedBy = "academicSyllabus", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SyllabusSubject> subjects = new ArrayList<>();

    public void setSubjects(List<SyllabusSubject> subjects) {
        if (this.subjects == null) {
            this.subjects = new ArrayList<>();
        }
        this.subjects.clear();
        if (subjects != null) {
            this.subjects.addAll(subjects);
            for (SyllabusSubject subject : subjects) {
                subject.setAcademicSyllabus(this);
            }
        }
    }
}
