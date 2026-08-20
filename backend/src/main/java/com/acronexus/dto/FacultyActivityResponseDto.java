package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class FacultyActivityResponseDto {
    private UUID id;
    private java.time.LocalDate date;
    private String status;
    private String reason;
    private UUID classSubjectId;
    private String subjectName;
    private String className;
    private String batch;
    private String academicYear;
    private String semester;
    private Boolean aiSessionCreated;
    private Integer totalStudents;
    private String topic;
    private Integer lectureNumber;
    private Integer presentCount;
    private Integer absentCount;
    private UUID sessionId;
    private UUID facultyId;
}
