package com.acronexus.dto;

import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoordinatorSectionStudentsDto {
    private String className;
    private String semester;
    private String batch;
    private String academicYear;
    private List<CoordinatorStudentDto> students;
    private Double sectionAverage;
}
