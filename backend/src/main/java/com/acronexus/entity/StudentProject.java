package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "student_projects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StudentProject extends BaseAuditableEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String title;
    
    private String description;
    
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tech_stack", columnDefinition = "text[]")
    private List<String> techStack;
    
    private String githubLink;
    private String liveLink;
}
