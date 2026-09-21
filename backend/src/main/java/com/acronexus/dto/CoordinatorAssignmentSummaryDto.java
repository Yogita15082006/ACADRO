package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CoordinatorAssignmentSummaryDto {
    private UUID id;
    private String batch;
    private String academicYear; // Corresponds to Study Year (1st Year, etc)
    private String className; // Represents Class/Section
}
