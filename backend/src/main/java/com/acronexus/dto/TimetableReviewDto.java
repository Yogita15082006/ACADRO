package com.acronexus.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimetableReviewDto {
    private List<SubjectMatch> subjectAssignments;
    private List<CoordinatorMatch> coordinatorAssignments;
    private List<String> unknowns;
    private List<String> conflicts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubjectMatch {
        private UUID facultyId;
        private String facultyName;
        private UUID subjectId;
        private String subjectName;
        private String subjectCode;
        private UUID classId;
        private String className;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CoordinatorMatch {
        private UUID coordinatorId;
        private String coordinatorName;
        private String className;
        private String batch;
        private String semester;
        private String academicYear;
    }
}
