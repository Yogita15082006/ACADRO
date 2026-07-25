package com.acronexus.service;

import com.acronexus.dto.BulkUploadResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

import com.acronexus.dto.AiFacultyValidationResultDto;

public interface FacultyBulkUploadService {
    BulkUploadResponseDto uploadFacultyList(MultipartFile file, UUID uploadedByUserId);
    BulkUploadResponseDto importValidatedFaculties(java.util.List<java.util.Map<String, Object>> records, UUID uploadedByUserId);
    AiFacultyValidationResultDto validateFacultyListWithAi(MultipartFile file, UUID uploadedByUserId);
    byte[] generateErrorReportCsv(UUID uploadId);
}
