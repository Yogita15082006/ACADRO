package com.acronexus.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CoordinatorScheduleDto {
    private List<LectureDto> lectures;
    private List<EventDto> events;

    @Data
    @Builder
    public static class LectureDto {
        private UUID id;
        private String subject;
        private String faculty;
        private String lectureNumber;
        private String startTime;
        private String endTime;
        private String status;
    }

    @Data
    @Builder
    public static class EventDto {
        private UUID id;
        private String title;
        private String eventDate;
        private String status;
        private Boolean includeInOverallAttendance;
        private Integer lecturesCount;
    }
}
