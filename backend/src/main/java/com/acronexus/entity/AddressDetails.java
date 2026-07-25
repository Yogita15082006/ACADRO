package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "address_details")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AddressDetails {
    
    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String localAddress;
    private String localCity;
    private String localState;
    private String localPincode;
    
    private String permanentAddress;
    private String permanentCity;
    private String permanentState;
    private String permanentPincode;
}
