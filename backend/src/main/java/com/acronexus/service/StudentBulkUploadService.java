package com.acronexus.service;

import com.acronexus.dto.BulkUploadResponseDto;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

import com.acronexus.dto.AiStudentValidationResultDto;

public interface StudentBulkUploadService {
    BulkUploadResponseDto uploadStudentList(MultipartFile file, UUID uploadedByUserId);
    BulkUploadResponseDto importValidatedStudents(java.util.List<java.util.Map<String, String>> records, UUID uploadedByUserId);
    AiStudentValidationResultDto validateStudentListWithAi(MultipartFile file, UUID uploadedByUserId);
    byte[] generateErrorReportCsv(UUID uploadId);
}
