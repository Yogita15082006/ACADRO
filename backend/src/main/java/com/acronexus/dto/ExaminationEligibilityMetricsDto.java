package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationEligibilityMetricsDto {
    private UUID id;
    private String name;
    private String enrollmentNo;
    private String className;
    private Double overallAttendance;
    private Double assignment;
    private Double quiz;
    private Double internal;
}
