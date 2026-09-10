package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyReportDto {
    private Profile profile;
    private Responsibilities responsibilities;
    private TeachingSummary teachingSummary;
    private List<TeachingHistoryDTO> teachingHistory;
    private List<TeachingExceptionRecord> teachingExceptions;
    private List<SubjectAssignment> subjectAssignments;
    private List<EventActivity> events;
    private List<NoticeRecord> notices;
    private List<QuizActivity> quizzes;
    private List<AssignmentActivity> assignments;
    private List<ExamCoordinatorActivity> examCoordinatorHistory;
    private List<DelegatedTask> facultyManagementTaskHistory;
    private List<RecentActivity> recentActivity;

    @Data
    @Builder
    public static class Profile {
        private String employeeId;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String whatsappNumber;
        private String personalEmail;
        private String gender;
        private String status;
        private String departmentName;
        private List<String> additionalDepartments;
        private String designation;
        private String qualification;
        private Integer experienceYears;
        private LocalDate joiningDate;
        private List<String> expertiseAreas;
        private Map<String, Object> uploadedDocuments;
    }

    @Data
    @Builder
    public static class Responsibilities {
        private List<String> currentRoles;
        private List<String> coordinatorForClasses;
        private int activeDelegatedTasks;
    }

    @Data
    @Builder
    public static class TeachingSummary {
        private long totalWorkingDays;
        private long totalPresentDays;
        private long totalAbsentDays;
        private long totalClassesScheduled;
        private long totalClassesConducted;
        private long totalClassesMissed;
        private long totalHolidaySessions;
        private int overallAttendancePercentage;
    }

    @Data
    @Builder
    public static class TeachingExceptionRecord {
        private LocalDate date;
        private String subjectName;
        private String className;
        private String status;
        private String remark;
    }

    @Data
    @Builder
    public static class SubjectAssignment {
        private UUID classSubjectId;
        private String subjectName;
        private String subjectCode;
        private String className;
        private String batchYear;
        private String semester;
    }

    @Data
    @Builder
    public static class EventActivity {
        private UUID eventId;
        private String eventName;
        private String eventDate;
        private String role;
        private String targetClasses;
        private String status;
    }

    @Data
    @Builder
    public static class NoticeRecord {
        private UUID noticeId;
        private String title;
        private String moduleType;
        private LocalDateTime publishDate;
        private String status;
        private String relatedEntity;
    }

    @Data
    @Builder
    public static class QuizActivity {
        private UUID quizId;
        private String title;
        private String subjectName;
        private String className;
        private LocalDateTime startTime;
    }

    @Data
    @Builder
    public static class AssignmentActivity {
        private UUID assignmentId;
        private String title;
        private String subjectName;
        private String className;
        private LocalDateTime dueDate;
        private long submissionCount;
    }

    @Data
    @Builder
    public static class ExamCoordinatorActivity {
        private UUID assignmentId;
        private String examPurpose;
        private String departmentName;
        private LocalDateTime assignedAt;
        private LocalDateTime validUntil;
        private String status;
        private LocalDateTime completedAt;
    }

    @Data
    @Builder
    public static class DelegatedTask {
        private UUID delegationId;
        private String taskPurpose;
        private String assignedBy;
        private LocalDateTime assignedAt;
        private LocalDateTime validUntil;
        private String status;
        private LocalDateTime completedAt;
    }

    @Data
    @Builder
    public static class RecentActivity {
        private LocalDateTime date;
        private String activityType;
        private String details;
        private String module;
    }
}
