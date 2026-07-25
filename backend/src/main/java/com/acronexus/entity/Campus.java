package com.acronexus.entity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "campuses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Campus extends BaseAuditableEntity {
    private String name;
    private String address;
    private Boolean isActive = true;
    private Boolean isDeleted = false;
}