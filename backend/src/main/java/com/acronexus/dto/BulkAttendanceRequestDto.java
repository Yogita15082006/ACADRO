package com.acronexus.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class BulkAttendanceRequestDto {
    @NotNull
    private LocalDate date;
    
    private List<UUID> studentIds;
    private List<UUID> sessionIds;
    private List<UUID> eventIds;
}
