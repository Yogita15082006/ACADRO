package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "student_achievements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StudentAchievement extends BaseAuditableEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private String category;
    
    private String date;
    private String description;
    private String link;
}
