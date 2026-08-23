package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "event_attendance_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventAttendanceSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @OneToMany(mappedBy = "eventAttendanceSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<EventAttendanceSessionSubject> subjects = new java.util.ArrayList<>();

    @Column(name = "lecture_count")
    @Builder.Default
    private Integer lectureCount = 1;

    @Column(name = "status")
    @Builder.Default
    private String status = "NOT_STARTED"; // NOT_STARTED, OPEN, CLOSED

    @Column(name = "attendance_code")
    private String attendanceCode;

    @Column(name = "timer_duration_minutes")
    private Integer timerDurationMinutes;

    @Column(name = "session_start_time")
    private Instant sessionStartTime;

    @Column(name = "unique_code_count")
    private Integer uniqueCodeCount;

    @Column(name = "is_included_in_overall")
    @Builder.Default
    private Boolean isIncludedInOverall = false;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<EventAttendanceRecord> records = new java.util.ArrayList<>();
}
