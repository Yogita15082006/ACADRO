package com.acronexus.service;

import com.acronexus.dto.BulkUploadResponseDto;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

public interface ResultBulkUploadService {
    BulkUploadResponseDto uploadResultList(MultipartFile file, UUID uploadedBy, UUID examinationId, String className, java.time.LocalDate examDate, UUID classSubjectId, boolean previewOnly);
    byte[] generateErrorReportCsv(UUID uploadId);
}
