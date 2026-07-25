package com.acronexus.service;

import com.acronexus.dto.AcademicResourceDto;
import com.acronexus.dto.ApiResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;
import java.util.List;

public interface AcademicResourceService {
    ApiResponse<AcademicResourceDto> uploadScheme(MultipartFile file, String academicYear, String batch, String className, String semester, UUID uploadedBy);
    ApiResponse<AcademicResourceDto> uploadSyllabus(MultipartFile file, String academicYear, String batch, String className, String department, String degree, String semester, UUID uploadedBy);

    List<AcademicResourceDto> getAllResources();
    byte[] downloadResource(UUID id);
    String getFileName(UUID id);
    void deleteResource(UUID id);
}
