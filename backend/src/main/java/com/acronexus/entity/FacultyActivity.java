package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "faculty_activities")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class FacultyActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_subject_id")
    private ClassSubject classSubject;

    @Column(nullable = false)
    private java.time.LocalDate date;

    private Integer lectureNumber = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacultyActivityStatus status;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marked_by")
    private User markedBy;

    @org.hibernate.annotations.CreationTimestamp
    private java.time.Instant createdAt;

    @Column(name = "session_id")
    private UUID sessionId;

}
