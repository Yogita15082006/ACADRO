package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student_login_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StudentLoginHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "login_timestamp", nullable = false)
    private Instant loginTimestamp;
}
