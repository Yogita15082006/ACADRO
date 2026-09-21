package com.acronexus.dto.seating;

import lombok.Data;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class SeatingRoomConfigDto {
    @JsonProperty("number")
    private String roomNumber;
    
    @JsonProperty("benches")
    private Integer benches;
    
    @JsonProperty("maxPerBench")
    private Integer maxPerBench;
    
    @JsonProperty("rowConfig")
    private java.util.List<Integer> rowConfig;
    
    @JsonProperty("invigilatorIds")
    private java.util.List<java.util.UUID> invigilatorIds;
    
    @JsonProperty("startTime")
    private String startTime;
    
    @JsonProperty("endTime")
    private String endTime;
}
