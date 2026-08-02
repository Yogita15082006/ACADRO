package com.acronexus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

public class QuizDto {

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
        private Instant startTime;
        private Instant endTime;
        private Integer durationMinutes;
        private Integer totalMarks;
        private Integer passingMarks;
        private String sourceType;
        private String sourceUrl;
        private Boolean isGraded;
        private String status; // UPCOMING, ACTIVE, COMPLETED based on time
        private UUID createdBy;
        private String createdByName;
        private String facultyName;
        private String questionType;
        private String difficulty;
        private Integer questionCount;
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

        @NotNull(message = "Start Time is required")
        private Instant startTime;

        @NotNull(message = "End Time is required")
        private Instant endTime;

        @NotNull(message = "Duration is required")
        private Integer durationMinutes;

        private Integer totalMarks;
        private Integer passingMarks;
        private String sourceType;
        private String sourceUrl;
        private String questionType;
        private String difficulty;
        private Integer questionCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String title;
        private String description;
        private Instant startTime;
        private Instant endTime;
        private Integer durationMinutes;
        private Integer totalMarks;
        private Integer passingMarks;
        private Boolean isGraded;
        private String questionType;
        private String difficulty;
        private Integer questionCount;
    }
}

