package com.acronexus.dto;

import lombok.Data;

@Data
public class ParsedCoordinatorAssignmentDto {
    private String coordinatorId;
    private String originalCoordinatorName;
    private String matchedCoordinatorName;
    private String className;
    private String batch;
    private String semester;
    private String academicYear;
}
