package com.acronexus.dto.seating;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SeatingGenerateRequestDto {
    private UUID examinationId;
    private List<SeatingRoomConfigDto> rooms;
    private List<String> eligibleEnrollments;
}
