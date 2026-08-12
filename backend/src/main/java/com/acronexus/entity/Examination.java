package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "examinations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Examination {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @Column(nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamType type;

    private String customType;

    @Enumerated(EnumType.STRING)
    private ExamStatus status = ExamStatus.UPCOMING;

    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id")
    private AcademicYear academicYear;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "examination_classes",
        joinColumns = @JoinColumn(name = "examination_id"),
        inverseJoinColumns = @JoinColumn(name = "class_id")
    )
    private java.util.Set<AcroClass> classes = new java.util.HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String description;

    private String batch;

    @OneToMany(mappedBy = "examination", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ExaminationEligibilityList> eligibilityLists = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "examination", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ExaminationTimetable> timetables = new java.util.ArrayList<>();

    private Boolean isDeleted = false;

    @org.hibernate.annotations.CreationTimestamp
    private java.time.Instant createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
