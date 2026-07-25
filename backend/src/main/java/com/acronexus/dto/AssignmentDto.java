package com.acronexus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.UUID;

public class AssignmentDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID id;
        private UUID classSubjectId;
        private String subjectName;
        private String className;
        private String title;
        private String description;
        private UUID fileId;
        private String fileUrl;
        private String fileName;
        private Integer maxMarks;
        private ZonedDateTime deadline;
        private ZonedDateTime createdAt;
        private UUID createdById;
        private String createdByName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "Class Subject ID is required")
        private UUID classSubjectId;
        
        @NotBlank(message = "Title is required")
        private String title;
        
        private String description;
        
        private UUID fileId;
        
        @NotNull(message = "Max marks are required")
        private Integer maxMarks;
        
        @NotNull(message = "Deadline is required")
        private ZonedDateTime deadline;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "Title is required")
        private String title;
        
        private String description;
        
        private UUID fileId;
        
        @NotNull(message = "Max marks are required")
        private Integer maxMarks;
        
        @NotNull(message = "Deadline is required")
        private ZonedDateTime deadline;
    }
}
