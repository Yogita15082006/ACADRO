package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDate;

@Entity
@Table(name = "examination_notices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ExaminationNotice extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_id", nullable = false)
    private Examination examination;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(length = 100)
    private String category;

    @Column(length = 20)
    private String priority;

    @Column(nullable = false)
    private LocalDate publishDate;

    private UUID attachmentFileId;
}
