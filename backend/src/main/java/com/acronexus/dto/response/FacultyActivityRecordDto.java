package com.acronexus.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class FacultyActivityRecordDto {
    private UUID id;
    private UUID facultyId;
    private String subjectName;
    private String className;
    private String semester;
    private String academicYear;
    private LocalDate date;
    private String status;
    private String reason;
}
