package com.acronexus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.UUID;

public class AssignmentDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID id;
        private UUID classSubjectId;
        private UUID subjectId;
        private UUID classId;
        private String subjectName;
        private String subjectCode;
        private String className;
        private String department;
        private String academicYear;
        private String semester;
        private String title;
        private String description;
        private String instructions;
        private String gradingCriteria;
        private String allowedFileTypes;
        private String maxUploadSize;
        private String type;
        private Boolean lateSubmissionAllowed;
        private Integer penaltyForLateSubmission;
        private UUID fileId;
        private String fileUrl;
        private String attachmentUrl;
        private String fileName;
        private Integer maxMarks;
        private ZonedDateTime deadline;
        private ZonedDateTime createdAt;
        private String createdDate;
        private UUID createdById;
        private String createdByName;
        private String facultyName;
        private String status;
        private String submissionStatus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private UUID classSubjectId;
        private UUID subjectId;
        private UUID classId;
        private String title;
        private String description;
        private String instructions;
        private String gradingCriteria;
        private String allowedFileTypes;
        private String maxUploadSize;
        private String type;
        private Boolean lateSubmissionAllowed;
        private Integer penaltyForLateSubmission;
        private UUID fileId;
        private Integer maxMarks;
        private ZonedDateTime deadline;
        private String deadlineStr;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String title;
        private String description;
        private String instructions;
        private String gradingCriteria;
        private String allowedFileTypes;
        private String maxUploadSize;
        private String type;
        private Boolean lateSubmissionAllowed;
        private Integer penaltyForLateSubmission;
        private UUID fileId;
        private Integer maxMarks;
        private ZonedDateTime deadline;
        private String deadlineStr;
    }
}
