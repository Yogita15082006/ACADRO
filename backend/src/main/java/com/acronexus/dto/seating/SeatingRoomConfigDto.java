package com.acronexus.dto.seating;

import lombok.Data;

@Data
public class SeatingRoomConfigDto {
    private String roomNumber;
    private Integer benches;
    private Integer maxPerBench;
    private java.util.List<java.util.UUID> invigilatorIds;
}
