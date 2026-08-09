package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "event_attendance_records", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"session_id", "unique_code_used"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventAttendanceRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private EventAttendanceSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "unique_code_used")
    private Integer uniqueCodeUsed;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "status")
    @Builder.Default
    private String status = "SUBMITTED"; // SUBMITTED, ABSENT, NOT_SUBMITTED
}
