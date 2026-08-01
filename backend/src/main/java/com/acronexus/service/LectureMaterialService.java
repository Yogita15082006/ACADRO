package com.acronexus.service;

import com.acronexus.dto.LectureMaterialRequestDto;
import com.acronexus.dto.LectureMaterialResponseDto;
import java.util.List;
import java.util.UUID;

public interface LectureMaterialService {
    // Faculty APIs
    LectureMaterialResponseDto uploadMaterial(LectureMaterialRequestDto request, String token);
    LectureMaterialResponseDto updateMaterial(UUID materialId, LectureMaterialRequestDto request, String token);
    void deleteMaterial(UUID materialId, String token);
    List<LectureMaterialResponseDto> getFacultyMaterials(String token);

    // Student APIs
    List<LectureMaterialResponseDto> getStudentMaterials(String token);
    LectureMaterialResponseDto getMaterialDetails(UUID materialId, String token);
    void trackDownload(UUID materialId, String token);

    // AI Insights
    com.acronexus.dto.ai.AiInsightDto generateStudyGuide(UUID materialId, String token);
    com.acronexus.dto.ai.AiInsightDto summarizeMaterial(UUID materialId, String token);

    // Subject Card Module APIs
    List<LectureMaterialResponseDto> getSubjectMaterials(UUID classSubjectId, com.acronexus.security.UserDetailsImpl userDetails);
    LectureMaterialResponseDto uploadSubjectMaterial(UUID classSubjectId, org.springframework.web.multipart.MultipartFile file, String title, String unit, Integer unitNumber, com.acronexus.security.UserDetailsImpl userDetails);
    void deleteSubjectMaterial(UUID materialId, com.acronexus.security.UserDetailsImpl userDetails, String token);
    byte[] downloadMaterialFile(UUID materialId);
    String getMaterialFileName(UUID materialId);
}
