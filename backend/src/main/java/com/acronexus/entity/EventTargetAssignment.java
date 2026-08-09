package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "event_target_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventTargetAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "batch_year")
    private String batchYear;

    @Column(name = "academic_year")
    private String academicYear;

    @Column(name = "semester")
    private String semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acro_class_id")
    private AcroClass acroClass;

    @Column(name = "is_entire_batch")
    @Builder.Default
    private Boolean isEntireBatch = false;
}
