package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "examination_eligibility_lists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationEligibilityList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_id", nullable = false)
    private Examination examination;

    @OneToMany(mappedBy = "eligibilityList", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExaminationEligibilityStudent> students = new ArrayList<>();

    @CreationTimestamp
    private Instant createdAt;
}
