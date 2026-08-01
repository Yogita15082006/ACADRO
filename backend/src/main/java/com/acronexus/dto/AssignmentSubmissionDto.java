package com.acronexus.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class AssignmentSubmissionDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID id;
        private UUID assignmentId;
        private UUID studentId;
        private String studentName;
        private String studentEnrollmentNo;
        private String name;
        private String enrollmentNumber;
        private String avatar;
        private UUID fileId;
        private String fileUrl;
        private String fileName;
        private Instant submittedAt;
        private String submitDate;
        private BigDecimal marksAwarded;
        private BigDecimal marks;
        private String feedback;
        private Boolean isLate;
        private String status;
        private String aiSimilarity;
        private String grade;
        private Instant evaluatedAt;
        private String evaluationDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitRequest {
        @NotNull(message = "File ID is required for submission")
        private UUID fileId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluateRequest {
        private BigDecimal marksAwarded;
        
        private String feedback;
        private String grade;
    }
}
