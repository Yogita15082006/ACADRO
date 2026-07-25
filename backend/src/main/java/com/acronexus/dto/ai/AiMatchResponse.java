package com.acronexus.dto.ai;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AiMatchResponse {
    private int studentsMatched;
    private int facultyMatched;
    private int subjectsMatched;
    private int schemeMatched;
    private int syllabusMatched;
    private int coordinatorAssigned;
    private int timetableMatched;
    private List<String> warnings;
    private List<String> errors;
    private List<String> suggestions;
    private double confidence;
    private List<Map<String, Object>> studentMappings;
    private List<Map<String, Object>> facultyMappings;
    private List<Map<String, Object>> coordinatorMappings;
    private List<Map<String, Object>> schemeMappings;
    private List<Map<String, Object>> syllabusMappings;
    private List<Map<String, Object>> timetableMappings;
}
