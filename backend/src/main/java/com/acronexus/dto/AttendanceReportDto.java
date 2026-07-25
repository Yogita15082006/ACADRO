package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

public class AttendanceReportDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EligibilityReportDto {
        private UUID studentId;
        private String studentName;
        private String enrollmentNo;
        private Integer totalClasses;
        private Integer presentClasses;
        private Double attendancePercentage;
        private Boolean isEligible;
        private Integer requiredClassesToBecomeEligible;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassAttendanceReportDto {
        private UUID classId;
        private String className;
        private Integer totalStudents;
        private Double averageAttendancePercentage;
        private List<EligibilityReportDto> studentEligibility;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FacultyReportDto {
        private UUID facultyId;
        private String facultyName;
        private Integer classesConducted;
        private Integer totalSessions;
        private Double averageAttendancePercentage;
        private Integer totalStudentsAttended;
        private Integer totalAbsentees;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentReportDto {
        private UUID studentId;
        private String studentName;
        private String enrollmentNo;
        private Double overallAttendancePercentage;
        private List<AttendanceDashboardDto.SubjectAttendanceDto> subjectWiseAttendance;
        private List<AttendanceDashboardDto.MonthlyAttendanceDto> monthlyAttendance;
        private Boolean isEligible;
        private Integer requiredClassesToBecomeEligible;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminDepartmentReportDto {
        private String departmentName;
        private Double overallAttendancePercentage;
        private Integer totalStudents;
        private List<ClassAttendanceReportDto> classComparisons;
        private List<EligibilityReportDto> studentsBelowThreshold;
    }
}
