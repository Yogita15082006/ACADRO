package com.acronexus.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ClassSubjectRequestDto {
    private UUID classId;
    private UUID subjectId;
    private UUID facultyId;
    private UUID academicYearId;
    private UUID semesterId;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
}
