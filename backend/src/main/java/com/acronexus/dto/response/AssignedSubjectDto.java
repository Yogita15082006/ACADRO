package com.acronexus.dto.response;

import lombok.Data;
import java.util.UUID;

@Data
public class AssignedSubjectDto {
    private UUID facultyId;
    private String subjectName;
    private String className;
    private String semester;
    private String academicYear;
}
