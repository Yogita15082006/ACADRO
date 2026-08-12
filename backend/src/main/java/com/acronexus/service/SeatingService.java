package com.acronexus.service;

import com.acronexus.dto.seating.SeatingArrangementDto;
import com.acronexus.dto.seating.SeatingGenerateRequestDto;
import java.util.UUID;

public interface SeatingService {
    SeatingArrangementDto generateSeatingPlan(SeatingGenerateRequestDto request);
    SeatingArrangementDto saveSeatingPlan(SeatingArrangementDto arrangementDto);
    SeatingArrangementDto getSeatingPlan(UUID examinationId);
    void deleteSeatingPlan(UUID examinationId);
}
