package com.acronexus.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class QuizAttemptDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private UUID id;
        private UUID quizId;
        private String quizTitle;
        private UUID studentId;
        private String studentName;
        private String studentEnrollmentNumber;
        private String studentProfilePictureUrl;
        private String studentAvatar;
        private BigDecimal score;
        private Integer totalMarks;
        private BigDecimal percentage;
        private Boolean passed;
        private String grade;
        private Boolean isLate;
        private Integer correctAnswers;
        private Integer wrongAnswers;
        private Integer unattemptedQuestions;
        private String resultSummary;
        private Instant startedAt;
        private Instant completedAt;
        private Instant evaluatedAt;
        private Object submittedAnswers;
        private Integer classRank;
        private Integer rank;
        private Integer totalStudents;
        private String submissionStatus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitRequest {
        @NotNull(message = "Answers are required")
        private Map<String, String> answers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompleteAnalysisResponse {
        private UUID attemptId;
        private UUID quizId;
        private String quizTitle;
        private String subjectName;
        private String facultyName;
        private String questionType;
        private String difficulty;
        private String className;
        private Integer totalQuestions;
        private Integer attemptedQuestions;
        private Integer unattemptedQuestions;
        private Integer correctAnswers;
        private Integer incorrectAnswers;
        private BigDecimal accuracyPercentage;
        private BigDecimal totalMarks;
        private BigDecimal marksObtained;
        private Integer passingMarks;
        private BigDecimal percentage;
        private Boolean passed;
        private String grade;
        private Integer durationMinutes;
        private Instant startedAt;
        private Instant submittedAt;
        private String timeTakenFormatted;

        private ClassPerformanceDto classPerformance;
        private AiPerformanceAnalysisDto aiAnalysis;
        private List<QuestionReviewDto> questionReviews;
        private List<TrendDataPoint> performanceTrend;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClassPerformanceDto {
        private Integer classRank;
        private Integer totalStudents;
        private BigDecimal studentMarks;
        private BigDecimal highestMarks;
        private BigDecimal lowestMarks;
        private BigDecimal classAverage;
        private BigDecimal studentPercentile;
        private String aiRankInsights;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiPerformanceAnalysisDto {
        private String summary;
        private String strongTopics;
        private String weakTopics;
        private String frequentlyMissedConcepts;
        private String improvementSuggestions;
        private String learningRecommendations;
        private String difficultyAnalysis;
        private String studyStrategy;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionReviewDto {
        private Integer questionNumber;
        private UUID questionId;
        private String questionText;
        private String questionType;
        private String studentAnswer;
        private String correctAnswer;
        private Integer marksAwarded;
        private Integer maximumMarks;
        private String status;
        private Object options;
        private String explanation;
        private String aiExplanation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendDataPoint {
        private String name;
        private BigDecimal score;
        private String quizTitle;
    }
}

