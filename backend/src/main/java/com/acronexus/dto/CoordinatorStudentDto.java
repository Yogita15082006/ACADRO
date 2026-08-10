package com.acronexus.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoordinatorStudentDto {
    private UUID id;
    private String name;
    private String enrollmentNumber;
    private String photo;
    private Double overallAttendance;
}
