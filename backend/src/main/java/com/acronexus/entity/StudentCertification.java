package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "student_certifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StudentCertification extends BaseAuditableEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private String issuer;
    
    private String date;
    private String link;
}
