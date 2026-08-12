package com.acronexus.dto.seating;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SeatingArrangementRoomDto {
    private UUID id;
    private String roomNumber;
    private Integer benches;
    private Integer maxPerBench;
    private Integer allocated;
    private List<String> classes;
    private List<UUID> invigilatorIds;
    private List<String> invigilatorNames;
    private List<SeatingArrangementStudentDto> students;
}
