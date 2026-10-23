package com.acronexus.dto.faculty;

import lombok.*;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyPromotionDto {
    private UUID id;
    private UUID facultyId;
    private String facultyName;
    private String employeeId;
    private String designation;
    private LocalDate promotionDate;
    private Boolean isProfessor;
    private Boolean isAssociate;
    private Boolean isAssistant;
    private String orderNumber;
    private String documentUrl;
    private String remarks;
    private ZonedDateTime createdAt;
}
