package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationAttendanceSubjectDto {
    private UUID studentId;
    private String studentName;
    private String enrollmentNo;
    private String avatar;
    private Boolean isPresent;
    private LocalDate examDate;
    private UUID examinationId;
    private String examinationName;
    private String examinationType;
    private UUID classSubjectId;
}
