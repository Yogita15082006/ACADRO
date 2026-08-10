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
        private int overallScore;
        private String badge;
        private String badgeColor;
        private String grade;
        private String feedback;
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
