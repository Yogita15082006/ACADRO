package com.acronexus.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "faculty_promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FacultyPromotion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Column(name = "designation", nullable = false)
    private String designation;

    @Column(name = "promotion_date")
    private LocalDate promotionDate;

    @Column(name = "is_professor")
    private Boolean isProfessor;

    @Column(name = "is_associate")
    private Boolean isAssociate;

    @Column(name = "is_assistant")
    private Boolean isAssistant;

    @Column(name = "order_number")
    private String orderNumber;

    @Column(name = "document_url", length = 500)
    private String documentUrl;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
