package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "lecture_materials")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LectureMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_subject_id", nullable = false)
    private ClassSubject classSubject;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer unitNumber;
    private Integer versionNumber = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id")
    private FileStorage file;

    private Boolean isActive = true;
    private Boolean isDeleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @org.hibernate.annotations.CreationTimestamp
    private java.time.Instant uploadedAt;

    @Column(length = 255)
    private String unit;

    @Column(length = 255)
    private String department;

    @Column(length = 100)
    private String batch;

    @Column(length = 50)
    private String year;

    @Column(length = 50)
    private String semester;

    @Column(length = 100)
    private String className;

    @Column(length = 255)
    private String facultyName;

    @Column(length = 255)
    private String fileName;

    @Column(length = 1000)
    private String fileUrl;

    @org.hibernate.annotations.UpdateTimestamp
    private java.time.Instant updatedAt;

}
