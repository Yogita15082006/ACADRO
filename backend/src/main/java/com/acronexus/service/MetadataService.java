package com.acronexus.service;

import com.acronexus.dto.MetadataDto;
import java.util.List;

public interface MetadataService {
    MetadataDto getAllMetadata();
    List<String> getClasses();
    List<String> getBatches();
    List<String> getDepartments();
    List<String> getDegrees();
    List<String> getAcademicYears();
    List<String> getSemesters();
    
    // Dynamic dependent mapping methods
    List<String> getClassesByBatch(String batch);
    List<String> getClassesBySemester(String batch, String semester);
    List<String> getAcademicYearsByBatch(String batch);
    List<String> getSemestersByYear(String year);

    List<String> getStatuses();
    List<String> getSubjects();
    List<String> getSections();
    List<String> getDesignations();
    List<String> getQualifications();
    List<String> getRoles();
}
