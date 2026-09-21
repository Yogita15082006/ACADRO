package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedResultContextDto {
    private UUID examinationId;
    private String examinationName;
    private java.time.LocalDate examDate;
    private UUID classSubjectId;
    private UUID subjectId;
    private String subjectCode;
    private String subjectName;
    private String className;
    private int totalStudents;
    private int savedResultCount;
    private int publishedResultCount;
}
