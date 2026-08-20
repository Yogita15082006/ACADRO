package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HodDashboardResponse {

    private String departmentName;
    private long departmentStudentCount;
    private long departmentFacultyCount;
    private long departmentClassCount;
    private long attendanceRecordCount;
    private long assignmentCount;
    private long quizCount;
    private long examinationCount;
    private long noticeCount;
    private long notificationCount;
    private Double departmentAttendancePercentage;
    private AcademicResourceSummary academicResources;
    private java.util.List<DepartmentStats> departmentBreakdowns;

    @Data @Builder
    public static class DepartmentStats {
        private String name;
        private long studentCount;
        private long facultyCount;
        private long classCount;
        private Double attendancePercentage;
    }

    @Data @Builder
    public static class AcademicResourceSummary {
        private long totalSchemes;
        private long totalSyllabus;
        private Long totalTimetables;
        private long totalLectureMaterials;
    }
}
