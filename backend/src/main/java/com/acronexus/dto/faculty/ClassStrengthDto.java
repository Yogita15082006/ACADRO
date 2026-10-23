package com.acronexus.dto.faculty;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassStrengthDto {
    private UUID id;
    private UUID departmentId;
    private String departmentName;
    private UUID classId;
    private String className;
    private String section;
    private UUID semesterId;
    private Integer semesterNumber;
    private String semesterName;
    private UUID academicYearId;
    private String academicYear;
    private Integer sanctionedIntake;
    private Long actualStrength;
    private Integer lateralEntryCount;
    private Integer supernumeraryCount;
    private Integer detainedCount;
    private String remarks;
}
