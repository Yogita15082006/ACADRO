package com.acronexus.dto;

import com.acronexus.entity.AttendanceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class AttendanceDashboardDto {

    @Data
    @Builder
    public static class StudentAttendanceHistoryDto {
        private LocalDate date;
        private String subjectName;
        private String facultyName;
        private AttendanceStatus status;
        private UUID sessionId;
        private Instant markedTime;
        private UUID classSubjectId;
        private String topic;
    }

    @Data
    @Builder
    public static class SubjectAttendanceDto {
        private String subjectName;
        private Integer totalClasses;
        private Integer classesAttended;
        private Integer classesMissed;
        private Double attendancePercentage;
    }

    @Data
    @Builder
    public static class OverallAttendanceDto {
        private Double overallPercentage;
        private Integer totalClasses;
        private Integer totalPresent;
        private Integer totalAbsent;
    }

    @Data
    @Builder
    public static class MonthlyAttendanceDto {
        private Integer month;
        private String monthName;
        private OverallAttendanceDto summary;
        private List<StudentAttendanceHistoryDto> records;
    }

    @Data
    @Builder
    public static class DailyAttendanceRegisterDto {
        private UUID studentId;
        private String studentName;
        private String enrollmentNumber;
        private AttendanceStatus status;
    }

    @Data
    @Builder
    public static class FacultyAttendanceHistoryDto {
        private UUID sessionId;
        private LocalDate date;
        private String subjectName;
        private String className;
        private Integer totalPresent;
        private Integer totalAbsent;
    }

    @Data
    @Builder
    public static class ClassAttendanceSummaryDto {
        private String className;
        private String subjectName;
        private Integer totalStudents;
        private Integer present;
        private Integer absent;
        private Double percentage;
    }
}
