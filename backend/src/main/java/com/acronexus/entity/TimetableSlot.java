package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "timetable_slots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TimetableSlot extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timetable_id", nullable = false)
    private Timetable timetable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(name = "day_of_week", nullable = false)
    private String dayOfWeek;

    @Column(name = "time_slot", nullable = false)
    private String timeSlot;

    @Column(name = "room_number")
    private String roomNumber;
    
    private Boolean isActive = true;
}
