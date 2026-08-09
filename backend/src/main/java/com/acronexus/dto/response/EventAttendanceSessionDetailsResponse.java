package com.acronexus.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAttendanceSessionDetailsResponse {
    private int totalRegistered;
    private int submitted;
    private int pending;
    private int notSubmitted;
    private int absent;
    private List<EventAttendanceRecordResponse> records;
}
