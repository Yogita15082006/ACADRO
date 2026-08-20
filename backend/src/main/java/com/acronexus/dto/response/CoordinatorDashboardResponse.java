package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CoordinatorDashboardResponse {
    private long totalClasses;
    private long totalStudents;
    private long totalSubjects;
    private long upcomingEvents;
    private long activeNotices;
    private long pendingAcademicActivities;

    private List<ClassOverview> classOverview;
    private EligibilityStats eligibilityStats;

    @Data @Builder
    public static class ClassOverview {
        private String className;
        private long studentCount;
        private Double attendancePercentage;
        private long eligibleStudents;
        private long defaulterStudents;
    }

    @Data @Builder
    public static class EligibilityStats {
        private long totalEligible;
        private long totalDefaulters;
    }
}
