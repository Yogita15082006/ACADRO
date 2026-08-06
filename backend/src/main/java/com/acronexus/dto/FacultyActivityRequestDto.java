package com.acronexus.dto;

import lombok.Data;

@Data
public class FacultyActivityRequestDto {
    private java.util.UUID classSubjectId;
    private java.time.LocalDate date;
    private String status; // PRESENT, ABSENT, MISSED, HOLIDAY
    private String reason;
}
