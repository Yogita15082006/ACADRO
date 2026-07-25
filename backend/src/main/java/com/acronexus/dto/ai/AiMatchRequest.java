package com.acronexus.dto.ai;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AiMatchRequest {
    private List<Map<String, Object>> students;
    private List<Map<String, Object>> faculty;
    private List<Map<String, Object>> classes;
    private List<Map<String, Object>> subjects;
    private List<Map<String, Object>> timetables;
    private List<Map<String, Object>> coordinators;
    private String matchType = "generic";
}
