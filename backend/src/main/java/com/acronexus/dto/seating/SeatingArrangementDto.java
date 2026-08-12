package com.acronexus.dto.seating;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SeatingArrangementDto {
    private UUID id;
    private UUID examinationId;
    private Integer totalStudents;
    private Integer roomsUtilized;
    private Integer totalCapacity;
    private Integer unallocatedStudents;
    
    private String batch;
    private String academicYear;
    private String semester;
    private String className;
    
    private List<SeatingArrangementRoomDto> roomAllocations;
}
