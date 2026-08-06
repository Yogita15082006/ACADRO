package com.acronexus.dto;

import lombok.Data;
import java.util.List;

@Data
public class FacultyActivityBulkRequestDto {
    private List<FacultyActivityRequestDto> activities;
}
