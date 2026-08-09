package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EventStatisticsDto {
    private String role;
    
    private Long totalEvents;
    private Long upcomingEvents;
    private Long ongoingEvents;
    private Long completedEvents;
    
    private Long registeredEvents;
    private Long attendedEvents;
    private Long missedEvents;
}
