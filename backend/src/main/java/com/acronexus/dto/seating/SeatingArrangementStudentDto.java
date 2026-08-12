package com.acronexus.dto.seating;

import lombok.Data;
import java.util.UUID;

@Data
public class SeatingArrangementStudentDto {
    private UUID id;
    private Integer sno;
    private String enrollment;
    private String name;
    private String className;
    private String row;
    private String bench;
    private Integer seat;
}
