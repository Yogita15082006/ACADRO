package com.acronexus.dto.faculty;

import lombok.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyResourcePersonDto {
    private UUID id;
    private UUID facultyId;
    private String resourceName;
    private String orgType;
    private String course;
    private Integer hours;
    private String academicYear;
    private String documentUrl;
    private String remarks;
    private ZonedDateTime createdAt;
}
