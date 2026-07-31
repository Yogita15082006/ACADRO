package com.acronexus.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class TimetableAssignmentRequestDto {
    private UUID timetableId;
    private String coordinator;
    private List<SubjectAssignment> subjects;

    @Data
    public static class SubjectAssignment {
        private String subjectCode;
        private String subjectName;
        private String subjectType;
        private String facultyName;
    }
}
