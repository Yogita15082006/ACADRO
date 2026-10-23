package com.acronexus.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "faculty_resource_persons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FacultyResourcePerson extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Column(name = "resource_name", nullable = false)
    private String resourceName;

    @Column(name = "org_type")
    private String orgType;

    @Column(name = "course")
    private String course;

    @Column(name = "hours")
    private Integer hours;

    @Column(name = "academic_year")
    private String academicYear;

    @Column(name = "document_url", length = 500)
    private String documentUrl;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
