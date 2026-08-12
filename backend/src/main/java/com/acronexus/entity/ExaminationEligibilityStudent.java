package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "examination_eligibility_students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationEligibilityStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "eligibility_list_id", nullable = false)
    private ExaminationEligibilityList eligibilityList;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private Boolean isEligible;
    private String reason;
    private Double overallAttendance;
    private Double assignmentPercentage;
    private Double quizPercentage;
    private Double internalPercentage;

}
