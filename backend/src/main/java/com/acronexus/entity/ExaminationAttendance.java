package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "examination_attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"examination_id", "student_id", "exam_date", "class_subject_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationAttendance extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_id", nullable = false)
    private Examination examination;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private Boolean isPresent;

    @Column(name = "exam_date")
    private java.time.LocalDate examDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_subject_id")
    private ClassSubject classSubject;
}
