package com.acronexus.service;

import com.acronexus.dto.ApiResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

public interface TimetableUploadService {
    ApiResponse<?> uploadTimetable(MultipartFile file, String departmentName, String academicYear, String semesterName, String className, String batchName, UUID uploadedBy);
    ApiResponse<?> getVersionHistory(UUID classId, UUID academicYearId, UUID semesterId);
    byte[] downloadVersion(UUID versionId);
    String getFileName(UUID versionId);
    ApiResponse<?> setActiveVersion(UUID versionId);
    ApiResponse<?> softDeleteVersion(UUID versionId);
    ApiResponse<?> getAllTimetables();
}
