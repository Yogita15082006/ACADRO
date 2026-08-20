package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class FacultyDashboardResponse {

    private long totalAssignedSubjects;
    private long totalClasses;
    private Long todayClassCount;
    private long pendingEvaluations;
    private long upcomingQuizCount;
    private Long upcomingExamCount;
    private long lectureMaterialCount;
    private List<NoticeSummary> recentNotices;
    private List<NotificationSummary> recentNotifications;
    private AcademicResourceSummary academicResources;
    private List<SubjectMetrics> subjectMetrics;
    private List<QuizPerformance> quizPerformance;
    private AssignmentSubmissionStats assignmentStats;

    @Data @Builder
    public static class SubjectMetrics {
        private String className;
        private String subjectName;
        private Double attendancePercentage;
        private long pendingAssignments;
        private Double quizAverage;
    }

    @Data @Builder
    public static class QuizPerformance {
        private String quizName;
        private Double averageMarks;
    }

    @Data @Builder
    public static class AssignmentSubmissionStats {
        private long submitted;
        private long late;
        private long missing;
    }

    @Data @Builder
    public static class NoticeSummary {
        private UUID id;
        private String title;
        private String category;
        private String priority;
        private ZonedDateTime publishDate;
    }

    @Data @Builder
    public static class NotificationSummary {
        private UUID id;
        private String title;
        private String message;
        private String type;
        private Boolean isRead;
        private Instant createdAt;
    }

    @Data @Builder
    public static class AcademicResourceSummary {
        private long lectureMaterials;
        private long schemes;
        private long syllabus;
        private Long timetables;
    }
}
