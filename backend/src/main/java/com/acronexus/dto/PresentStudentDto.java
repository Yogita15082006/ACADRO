package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresentStudentDto {
    private String enrollmentNo;
    private String studentName;
    private String section;
}
