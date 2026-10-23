package com.acronexus.dto.faculty;

import com.acronexus.dto.response.AssignedSubjectDto;
import lombok.*;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyWorkloadDto {
    private UUID facultyId;
    private String facultyName;
    private String employeeId;
    private List<AssignedSubjectDto> assignedSubjects;
    private Integer calculatedTheoryHours;
    private Integer calculatedLabHours;
    private Integer calculatedTotalHours;
    private Integer customTheoryHours;
    private Integer customLabHours;
    private String projectGuideDetails;
    private String mentoringDetails;
    private String adminDuties;
}
