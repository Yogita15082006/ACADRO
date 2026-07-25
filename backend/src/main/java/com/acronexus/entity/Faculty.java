package com.acronexus.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "faculties")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Faculty implements Persistable<java.util.UUID> {
    @Id
    @Column(name = "user_id")
    private java.util.UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(unique = true, nullable = false)
    private String employeeId;
    
    private String designation;
    private LocalDate joiningDate;
    private String qualification;
    
    @Column(name = "experience_years")
    private Integer experienceYears;
    
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "expertise_areas")
    private List<String> expertiseAreas;

    // Transient flag for Persistable support (matches Student entity pattern)
    @Transient
    private boolean isNewEntity = false;

    @Override
    public boolean isNew() {
        return isNewEntity;
    }

    /**
     * Mark this entity as new so that Spring Data uses persist() instead of merge().
     * Required because @MapsId sets the ID from User before save().
     */
    public void markAsNew() {
        this.isNewEntity = true;
    }


    public java.util.UUID getId() {
        return this.id;
    }
    public void setId(java.util.UUID id) {
        this.id = id;
    }

    public User getUser() {
        return this.user;
    }
    public void setUser(User user) {
        this.user = user;
    }

    public String getEmployeeId() {
        return this.employeeId;
    }
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getDesignation() {
        return this.designation;
    }
    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public LocalDate getJoiningDate() {
        return this.joiningDate;
    }
    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }

    public String getQualification() {
        return this.qualification;
    }
    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public Integer getExperienceYears() {
        return this.experienceYears;
    }
    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public List<String> getExpertiseAreas() {
        return this.expertiseAreas;
    }
    public void setExpertiseAreas(List<String> expertiseAreas) {
        this.expertiseAreas = expertiseAreas;
    }

    public boolean getIsNewEntity() {
        return this.isNewEntity;
    }
    public void setIsNewEntity(boolean isNewEntity) {
        this.isNewEntity = isNewEntity;
    }
}