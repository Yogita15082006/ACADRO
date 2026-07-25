package com.acronexus.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class User extends BaseAuditableEntity {
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String passwordHash;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    private String phone;
    
    @Enumerated(EnumType.STRING)
    private Gender gender;
    
    private LocalDate dob;
    
    @Enumerated(EnumType.STRING)
    private BloodGroup bloodGroup;
    
    private String profilePictureUrl;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    private String category;
    private String nationality;
    private String religion;
    
    @Column(name = "aadhaar_number")
    private String aadhaarNumber;
    
    @Column(name = "residence_type")
    private String residenceType;
    
    @Column(name = "whatsapp_number")
    private String whatsappNumber;
    
    @Column(name = "personal_email")
    private String personalEmail;
    
    @Column(name = "college_email")
    private String collegeEmail;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "uploaded_documents", columnDefinition = "jsonb")
    private Map<String, Object> uploadedDocuments;
    
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @Column(name = "is_activated")
    private Boolean isActivated = false;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "updated_by")
    private UUID updatedBy;
}