package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CoordinatorAssignmentResponseDto {
    private UUID id;
    private String name;
    private String email;
    private String empId;
    private java.util.List<AssignmentDetail> assignments;

    @Data
    public static class AssignmentDetail {
        private String className;
        private String batch;
        private String academicYear;
        private String semester;
    }
    private String createdAt;
}
