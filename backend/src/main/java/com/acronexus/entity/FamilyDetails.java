package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "family_details")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class FamilyDetails {
    
    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String fatherName;
    private String fatherMobile;
    private String fatherOccupation;
    private String fatherDesignation;
    private String fatherOrganization;
    
    private String motherName;
    private String motherMobile;
    private String motherOccupation;
    private String motherDesignation;
    private String motherOrganization;
    
    private String familyStatus;
    private Integer numberOfBrothers;
    private Integer numberOfSisters;
    private String annualIncome;
}
