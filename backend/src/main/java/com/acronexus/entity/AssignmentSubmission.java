package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "assignment_submissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id")
    private FileStorage file;

    @org.hibernate.annotations.CreationTimestamp
    private java.time.Instant submittedAt;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal marksAwarded;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private Boolean isLate = false;

    @Column(length = 30)
    private String status;

    @Column(length = 10)
    private String grade;

    private java.time.Instant evaluatedAt;

}
