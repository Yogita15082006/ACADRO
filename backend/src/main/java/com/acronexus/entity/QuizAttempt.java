package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "quiz_attempts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal score;

    @org.hibernate.annotations.CreationTimestamp
    private java.time.Instant startedAt;

    private java.time.Instant completedAt;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private java.util.Map<String, String> submittedAnswers = new java.util.HashMap<>();

    @Column(length = 10)
    private String grade;

    private Boolean isPassed;

    private java.time.Instant evaluatedAt;

    private Boolean isLate = false;

    private Integer correctAnswers;

    private Integer wrongAnswers;

    private Integer unattemptedQuestions;

    @Column(length = 2000)
    private String resultSummary;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal percentage;

    @Column(columnDefinition = "TEXT", name = "ai_analysis_json")
    private String aiAnalysisJson;

}
