package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quizzes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Quiz extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_subject_id", nullable = false)
    private ClassSubject classSubject;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private java.time.Instant startTime;

    @Column(nullable = false)
    private java.time.Instant endTime;

    @Column(nullable = false)
    private Integer durationMinutes;

    private Integer totalMarks;

    private Integer passingMarks;

    @Column(length = 50)
    private String sourceType;

    @Column(length = 1000)
    private String sourceUrl;

    @Column(length = 100)
    private String questionType;

    @Column(length = 50)
    private String difficulty;

    private Integer questionCount = 0;

    private Boolean isGraded = false;

    private Boolean isDeleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

}
