package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamStudentCategorySummaryDto {
    private int totalStudents;
    private int appearedCount;
    private int eligibleNotAppearedCount;
    private int notEligibleCount;
    private List<PresentStudentDto> allStudents;
    private List<PresentStudentDto> appearedStudents;
    private List<PresentStudentDto> eligibleNotAppearedStudents;
    private List<PresentStudentDto> notEligibleStudents;
}
