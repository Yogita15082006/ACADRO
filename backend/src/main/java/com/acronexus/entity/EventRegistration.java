package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "event_registrations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"event_id", "student_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @CreationTimestamp
    @Column(name = "registered_at", updatable = false)
    private Instant registeredAt;

    @Column(name = "attendance_status")
    @Builder.Default
    private String attendanceStatus = "PENDING";

    @Column(name = "certificate_generated")
    @Builder.Default
    private Boolean certificateGenerated = false;

    @Column(name = "custom_form_responses", columnDefinition = "TEXT")
    private String customFormResponses;
}
