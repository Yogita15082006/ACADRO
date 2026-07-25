package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetadataDto {
    private List<String> classes;
    private List<String> batches;
    private List<String> departments;
    private List<String> degrees;
    private List<String> academicYears;
    private List<String> semesters;
    private List<String> statuses;
    private List<String> subjects;
    private List<String> sections;
    private List<String> designations;
    private List<String> qualifications;
    private List<String> roles;
}
