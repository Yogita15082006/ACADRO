package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "student_internships")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StudentInternship extends BaseAuditableEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String role;
    
    @Column(nullable = false)
    private String company;
    
    private String mentor;
    private String duration;
    
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "technologies", columnDefinition = "text[]")
    private List<String> technologies;
    
    private String description;
    private String link;
}
