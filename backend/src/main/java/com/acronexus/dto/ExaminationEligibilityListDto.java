package com.acronexus.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;
import java.time.Instant;

@Data
public class ExaminationEligibilityListDto {
    private UUID id;
    private UUID examinationId;
    private Instant createdAt;
    private List<ExaminationEligibilityStudentDto> students;
}
