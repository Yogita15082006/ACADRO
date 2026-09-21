package com.acronexus.entity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "classes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AcroClass extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "degree_program_id")
    private DegreeProgram degreeProgram;
    private String name;
    private String section;
    private Boolean isActive = true;
    private Boolean isDeleted = false;

    /**
     * Returns the ACADRO functional Class value, which is the Section.
     * Fallback to parent name if section is missing to avoid NPEs, but functional logic
     * expects Section to be fully populated for proper scoped isolation.
     */
    public String getFunctionalClassName() {
        if (this.section != null && !this.section.trim().isEmpty()) {
            return this.section.trim();
        }
        return this.name;
    }
}