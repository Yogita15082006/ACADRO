package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class SubjectAnalyticsDTO {
    private UUID id;
    private String name;
    private String enrollmentNumber;
    private String email;
    private MetricsDTO metrics;

    @Data
    public static class MetricsDTO {
        private AssignmentMetricsDTO assignments;
        private QuizMetricsDTO quizzes;
        private AttendanceMetricsDTO attendance;
        private java.util.List<ExaminationMetricsDTO> examinations;
        private int overallScore;
        private String badge;
        private String badgeColor;
        private String grade;
        private String feedback;
    }

    @Data
    public static class ExaminationMetricsDTO {
        private UUID examinationId;
        private UUID examResultId;
        private String name;
        private java.math.BigDecimal obtainedMarks;
        private java.math.BigDecimal maxMarks;
        private java.time.LocalDate examDate;
        private Boolean isPublished;
    }

    @Data
    public static class AssignmentMetricsDTO {
        private int total;
        private int submitted;
        private int pending;
        private int percentage;
    }

    @Data
    public static class QuizMetricsDTO {
        private int total;
        private int attempted;
        private int average;
    }

    @Data
    public static class AttendanceMetricsDTO {
        private int total;
        private int present;
        private int absent;
        private int percentage;
    }
}
