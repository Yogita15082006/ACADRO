package com.acronexus.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

@Data
public class CoordinatorAssignmentRequestDto {
    @NotNull(message = "Faculty ID is required")
    private UUID facultyId;
    
    private List<AssignmentDetail> assignments;

    @Data
    public static class AssignmentDetail {
        private String className;
        private String batch;
        private String academicYear;
        private String semester;
    }
}
