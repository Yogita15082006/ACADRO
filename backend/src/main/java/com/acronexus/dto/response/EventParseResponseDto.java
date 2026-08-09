package com.acronexus.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventParseResponseDto {
    private String title;
    private String subtitle;
    private String category;
    private String description;
    
    private String date;
    private String startTime;
    private String endTime;
    
    private String mode;
    private String venue;
    private String locationLink;
    private String meetingLink;
    
    private String regStartDate;
    private String regEndDate;
    private String maxParticipants;
    private String regFee;
    
    private String isRegRequired;
    private String registrationMethod;
    private String registrationExternalLink;
    
    private Boolean allowWaitingList;
    private String rulesAndGuidelines;
}
