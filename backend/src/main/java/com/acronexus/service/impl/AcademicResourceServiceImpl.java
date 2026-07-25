package com.acronexus.service.impl;

import com.acronexus.dto.AcademicResourceDto;
import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.ai.AiGenericRequest;
import com.acronexus.dto.ai.AiGenericResponse;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.AcademicResourceService;
import com.acronexus.service.AiService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicResourceServiceImpl implements AcademicResourceService {

    private final FileStorageRepository fileStorageRepository;
    private final UserRepository userRepository;
    private final AcademicSchemeRepository academicSchemeRepository;
    private final AcademicSyllabusRepository academicSyllabusRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    private static final String UPLOAD_DIR = "uploads/academic_resources/";

    @Override
    @Transactional
    public ApiResponse<AcademicResourceDto> uploadScheme(MultipartFile file, String academicYear, String batch, String className, String semester, UUID uploadedBy) {
        validatePdf(file);
        User user = userRepository.findById(uploadedBy).orElseThrow(() -> new IllegalArgumentException("User not found"));

        Map<String, Object> metadataMap = new HashMap<>();
        metadataMap.put("academicYear", academicYear);
        metadataMap.put("batch", batch);
        metadataMap.put("className", className);
        metadataMap.put("semester", semester);
        
        FileStorage fileStorage = saveFile(file, user, "SCHEME", metadataMap);

        AcademicScheme scheme = new AcademicScheme();
        scheme.setBatch(batch);
        scheme.setClassName(className);
        scheme.setAcademicYear(academicYear);
        scheme.setSemester(semester);
        scheme.setFileStorage(fileStorage);
        academicSchemeRepository.save(scheme);

        return ApiResponse.success("Scheme uploaded successfully", mapToDto(fileStorage));
    }

    private List<Map<String, Object>> validateSyllabusAi(FileStorage fileStorage, MultipartFile file, String[] statusOut) {
        long startTime = System.currentTimeMillis();
        int aiRequestsCount = 0;
        int retryCount = 0;
        int rateLimit429Count = 0;
        String finalReason = "UNKNOWN";
        List<Map<String, Object>> allDetectedSubjects = new ArrayList<>();

        try {
            // Convert relative document URL to absolute path for external Python FastAPI access
            java.io.File pdfFile = new java.io.File(fileStorage.getDocumentUrl().replace("file://", "").replace("%20", " "));
            String absolutePath = pdfFile.getAbsolutePath();
            log.info("Sending absolute path to AI Service for syllabus parsing: {}", absolutePath);

            // Call AI Service endpoint for single AI request and PyMuPDF local processing
            Map<String, Object> parseResult = aiService.parseSyllabus(absolutePath);
            if (parseResult != null) {
                if (parseResult.get("aiRequestsCount") instanceof Number) {
                    aiRequestsCount = ((Number) parseResult.get("aiRequestsCount")).intValue();
                }
                if (parseResult.get("retryCount") instanceof Number) {
                    retryCount = ((Number) parseResult.get("retryCount")).intValue();
                }
                if (parseResult.get("rateLimit429Count") instanceof Number) {
                    rateLimit429Count = ((Number) parseResult.get("rateLimit429Count")).intValue();
                }
                if (parseResult.get("reason") != null) {
                    finalReason = String.valueOf(parseResult.get("reason"));
                }
                if (parseResult.get("status") != null) {
                    statusOut[0] = String.valueOf(parseResult.get("status"));
                }
                if (parseResult.get("subjects") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> subjects = (List<Map<String, Object>>) parseResult.get("subjects");
                    allDetectedSubjects.addAll(subjects);
                }
                if (allDetectedSubjects.isEmpty() || "Failed".equalsIgnoreCase(statusOut[0])) {
                    log.warn("AI Service returned empty subjects or Failed status ({}). Executing local Java fallback extraction...", statusOut[0]);
                    statusOut[0] = "Processed (Local Fallback)";
                    finalReason = "SUCCESS - Local Fallback executed after AI service returned Failed or empty subjects";
                    allDetectedSubjects = executeJavaLocalFallbackExtraction(file);
                }
            }
        } catch (Exception e) {
            log.warn("AI Service syllabus parsing encountered error or rate limit: {}. Executing local Java fallback extraction...", e.getMessage());
            statusOut[0] = "Processed (Local Fallback)";
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                rateLimit429Count++;
            }
            finalReason = "SUCCESS - Local Fallback executed after AI service error/rate limit: " + e.getMessage();
            allDetectedSubjects = executeJavaLocalFallbackExtraction(file);
        }

        long totalTimeMs = System.currentTimeMillis() - startTime;
        
        // Logging metrics per upload (Requirement 7)
        log.info("================= SYLLABUS AI PARSING TELEMETRY =================");
        log.info("• Number of AI requests made per upload: {}", aiRequestsCount);
        log.info("• Total processing time: {} ms ({}s)", totalTimeMs, String.format("%.2f", totalTimeMs / 1000.0));
        log.info("• Retry count: {}", retryCount);
        log.info("• 429 responses: {}", rateLimit429Count);
        log.info("• Final success/failure reason: {}", finalReason);
        log.info("=================================================================");

        return allDetectedSubjects;
    }

    private List<Map<String, Object>> executeJavaLocalFallbackExtraction(MultipartFile file) {
        List<Map<String, Object>> fallbackSubjects = new ArrayList<>();
        try {
            PdfExtractionResult pdfResult = extractTextFromPdf(file);
            String pdfText = pdfResult.text;
            if (pdfText == null || pdfText.trim().isEmpty()) {
                return fallbackSubjects;
            }

            java.util.regex.Pattern p = java.util.regex.Pattern.compile("([A-Z]{2,4}\\s*[-]?\\s*\\d{3}\\s*(?:\\([A-Z0-9]+\\))?)\\s*[:\\-–\\s]+\\s*([A-Z][A-Za-z0-9\\s,&+\\-/]{3,50})");
            java.util.regex.Matcher m = p.matcher(pdfText);
            Set<String> seenCodes = new HashSet<>();
            List<int[]> foundPositions = new ArrayList<>();
            List<Map<String, Object>> tempList = new ArrayList<>();

            while (m.find()) {
                String code = m.group(1).trim();
                String name = m.group(2).trim();
                if (code.toUpperCase().contains("UNIT") || code.toUpperCase().contains("PAGE") || name.length() < 3) {
                    continue;
                }
                String type = "Theory";
                String combined = (code + " " + name).toLowerCase();
                if (combined.contains("open") || combined.contains("open elective")) {
                    type = "Open Elective";
                } else if (combined.contains("departmental") || combined.contains("elective") || combined.contains("de ")) {
                    type = "Departmental Elective";
                } else if (combined.contains("lab") || combined.contains("practical")) {
                    type = "Practical";
                }
                code = code.replaceAll("(?i)^(?:Departmental|Open|Program)?\\s*(?:Elective)?\\s*", "").trim();
                if (!seenCodes.contains(code.toUpperCase())) {
                    seenCodes.add(code.toUpperCase());
                    Map<String, Object> subMap = new HashMap<>();
                    subMap.put("subjectCode", code);
                    subMap.put("subjectName", name);
                    subMap.put("type", type);
                    subMap.put("unitTitles", new ArrayList<String>());
                    tempList.add(subMap);
                    foundPositions.add(new int[]{m.start(), tempList.size() - 1});
                }
            }

            if (tempList.isEmpty()) {
                Map<String, Object> genMap = new HashMap<>();
                genMap.put("subjectCode", "GENERAL");
                genMap.put("subjectName", "General Academic Syllabus");
                genMap.put("type", "General");
                genMap.put("unitTitles", new ArrayList<String>());
                genMap.put("rawContent", pdfText.trim());
                fallbackSubjects.add(genMap);
            } else {
                for (int i = 0; i < foundPositions.size(); i++) {
                    int startPos = foundPositions.get(i)[0];
                    int endPos = (i + 1 < foundPositions.size()) ? foundPositions.get(i + 1)[0] : pdfText.length();
                    int idx = foundPositions.get(i)[1];
                    Map<String, Object> subMap = tempList.get(idx);
                    subMap.put("rawContent", pdfText.substring(startPos, endPos).trim());
                    fallbackSubjects.add(subMap);
                }
            }
        } catch (Exception e) {
            log.error("Error during Java local fallback extraction: {}", e.getMessage(), e);
        }
        return fallbackSubjects;
    }

    @Override
    @Transactional
    public ApiResponse<AcademicResourceDto> uploadSyllabus(MultipartFile file, String academicYear, String batch, String className, String department, String degree, String semester, UUID uploadedBy) {
        validatePdf(file);
        User user = userRepository.findById(uploadedBy).orElseThrow(() -> new IllegalArgumentException("User not found"));

        Map<String, Object> metadataMap = new HashMap<>();
        metadataMap.put("academicYear", academicYear);
        if (batch != null && !batch.isEmpty()) metadataMap.put("batch", batch);
        if (className != null && !className.isEmpty()) metadataMap.put("className", className);
        if (department != null && !department.isEmpty()) metadataMap.put("department", department);
        if (degree != null && !degree.isEmpty()) metadataMap.put("degree", degree);
        metadataMap.put("semester", semester);
        metadataMap.put("status", "Processing");

        // Save file immediately so uploaded PDF is never lost even if parsing errors occur
        FileStorage fileStorage = saveFile(file, user, "SYLLABUS", metadataMap);

        String[] statusOut = new String[]{"Processed"};
        List<Map<String, Object>> detectedSubjects = validateSyllabusAi(fileStorage, file, statusOut);
        
        metadataMap.put("status", statusOut[0]);
        metadataMap.put("totalSubjects", detectedSubjects.size());
        try {
            fileStorage.setAiMetadata(objectMapper.writeValueAsString(metadataMap));
        } catch (JsonProcessingException e) {
            fileStorage.setAiMetadata("{}");
        }
        fileStorageRepository.save(fileStorage);

        AcademicSyllabus syllabus = new AcademicSyllabus();
        syllabus.setBatch(batch);
        syllabus.setClassName(className);
        syllabus.setAcademicYear(academicYear);
        syllabus.setSemester(semester);
        syllabus.setDepartment(department);
        syllabus.setDegree(degree);
        syllabus.setTotalSubjects(detectedSubjects.size());
        syllabus.setProcessingStatus(statusOut[0]);
        syllabus.setFileStorage(fileStorage);

        List<SyllabusSubject> subjectEntities = new ArrayList<>();
        for (Map<String, Object> ds : detectedSubjects) {
            SyllabusSubject ss = new SyllabusSubject();
            ss.setAcademicSyllabus(syllabus);
            
            String sc = (String) ds.get("subjectCode");
            if (sc != null && sc.length() > 255) sc = sc.substring(0, 255);
            ss.setSubjectCode(sc);
            
            String sn = (String) ds.get("subjectName");
            if (sn != null && sn.length() > 255) sn = sn.substring(0, 255);
            ss.setSubjectName(sn);
            
            Object cred = ds.get("credits");
            if (cred instanceof Number) ss.setCredits(((Number) cred).intValue());
            else if (cred instanceof String) { try { ss.setCredits(Integer.parseInt(cred.toString().trim())); } catch (Exception ignored) {} }
            
            Object th = ds.get("theoryHours");
            if (th instanceof Number) ss.setTheoryHours(((Number) th).intValue());
            else if (th instanceof String) { try { ss.setTheoryHours(Integer.parseInt(th.toString().trim())); } catch (Exception ignored) {} }

            Object ph = ds.get("practicalHours");
            if (ph instanceof Number) ss.setPracticalHours(((Number) ph).intValue());
            else if (ph instanceof String) { try { ss.setPracticalHours(Integer.parseInt(ph.toString().trim())); } catch (Exception ignored) {} }

            String t = (String) ds.get("type");
            if (t != null && t.length() > 255) t = t.substring(0, 255);
            ss.setType(t);
            
            ss.setRawContent((String) ds.get("rawContent"));

            Object ut = ds.get("unitTitles");
            if (ut instanceof List) {
                try {
                    @SuppressWarnings("unchecked")
                    List<String> stringList = (List<String>) ut;
                    ss.setUnitTitles(stringList);
                } catch (Exception ignored) {}
            }
            subjectEntities.add(ss);
        }
        syllabus.setSubjects(subjectEntities);
        academicSyllabusRepository.save(syllabus);

        return ApiResponse.success("Syllabus uploaded successfully", mapToDto(fileStorage));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AcademicResourceDto> getAllResources() {
        List<FileStorage> files = fileStorageRepository.findAll().stream()
                .filter(fs -> ("SCHEME".equals(fs.getFileType()) || "SYLLABUS".equals(fs.getFileType())) && !Boolean.TRUE.equals(fs.getIsDeleted()))
                .sorted((f1, f2) -> {
                    ZonedDateTime t1 = f1.getUploadedAt() != null ? f1.getUploadedAt() : ZonedDateTime.now().minusYears(100);
                    ZonedDateTime t2 = f2.getUploadedAt() != null ? f2.getUploadedAt() : ZonedDateTime.now().minusYears(100);
                    return t2.compareTo(t1);
                })
                .collect(Collectors.toList());

        return files.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadResource(UUID id) {
        FileStorage file = fileStorageRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        if (file.getDocumentUrl() == null) {
            throw new IllegalArgumentException("File not found for this resource");
        }
        try {
            Path path = Paths.get(file.getDocumentUrl());
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Error reading file", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getFileName(UUID id) {
        FileStorage file = fileStorageRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        return file.getFileName();
    }

    @Override
    @Transactional
    public void deleteResource(UUID id) {
        FileStorage file = fileStorageRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        
        java.util.Optional<com.acronexus.entity.AcademicSyllabus> syllabus = academicSyllabusRepository.findByFileStorageId(id);
        if (syllabus.isPresent()) {
            academicSyllabusRepository.delete(syllabus.get());
        }

        java.util.Optional<com.acronexus.entity.AcademicScheme> scheme = academicSchemeRepository.findByFileStorageId(id);
        if (scheme.isPresent()) {
            academicSchemeRepository.delete(scheme.get());
        }
        
        try {
            if (file.getDocumentUrl() != null) {
                Files.deleteIfExists(Paths.get(file.getDocumentUrl()));
            }
        } catch (IOException e) {
            log.warn("Failed to delete physical file for resource {}: {}", id, e.getMessage());
        }

        fileStorageRepository.delete(file);
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!originalFilename.endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are supported");
        }
    }

    private static class PdfExtractionResult {
        String text;
        int totalPages;
        PdfExtractionResult(String text, int totalPages) {
            this.text = text;
            this.totalPages = totalPages;
        }
    }

    private PdfExtractionResult extractTextFromPdf(MultipartFile file) {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            int totalPages = document.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            return new PdfExtractionResult(text, totalPages);
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid PDF file structure or corrupted file.");
        }
    }

    private FileStorage saveFile(MultipartFile file, User user, String type, Map<String, Object> metadata) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            FileStorage fs = new FileStorage();
            fs.setFileName(file.getOriginalFilename());
            fs.setDocumentUrl(filePath.toString());
            fs.setFileType(type);
            fs.setUploadedBy(user);
            fs.setUploadedAt(ZonedDateTime.now());
            fs.setIsActive(true);
            fs.setIsDeleted(false);
            
            try {
                fs.setAiMetadata(objectMapper.writeValueAsString(metadata));
            } catch (JsonProcessingException e) {
                fs.setAiMetadata("{}");
            }
            
            return fileStorageRepository.save(fs);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    private AcademicResourceDto mapToDto(FileStorage fs) {
        final Map<String, Object> metadata = new HashMap<>();
        try {
            if (fs.getAiMetadata() != null && !fs.getAiMetadata().isEmpty()) {
                Map<String, Object> parsed = objectMapper.readValue(fs.getAiMetadata(), new TypeReference<Map<String, Object>>() {});
                metadata.putAll(parsed);
            }
        } catch (Exception e) {
            log.warn("Failed to parse metadata for file {}", fs.getId());
        }

        String uploaderName = "Unknown";
        if (fs.getUploadedBy() != null) {
            uploaderName = fs.getUploadedBy().getFirstName() + " " + (fs.getUploadedBy().getLastName() != null ? fs.getUploadedBy().getLastName() : "");
        }

        if (fs.getFileType().equals("SCHEME")) {
            academicSchemeRepository.findByFileStorageId(fs.getId()).ifPresent(scheme -> {
                metadata.put("batch", scheme.getBatch());
                metadata.put("className", scheme.getClassName());
                metadata.put("academicYear", scheme.getAcademicYear());
                metadata.put("semester", scheme.getSemester());
            });
        } else if (fs.getFileType().equals("SYLLABUS")) {
            academicSyllabusRepository.findByFileStorageId(fs.getId()).ifPresent(syllabus -> {
                  metadata.put("batch", syllabus.getBatch());
                  metadata.put("className", syllabus.getClassName());
                  metadata.put("academicYear", syllabus.getAcademicYear());
                  metadata.put("semester", syllabus.getSemester());
                  metadata.put("department", syllabus.getDepartment());
                  metadata.put("degree", syllabus.getDegree());
                  metadata.put("totalSubjects", syllabus.getTotalSubjects());
                metadata.put("status", syllabus.getProcessingStatus());
                
                List<Map<String, Object>> subjList = new ArrayList<>();
                for (SyllabusSubject ss : syllabus.getSubjects()) {
                    Map<String, Object> smap = new HashMap<>();
                    smap.put("subjectCode", ss.getSubjectCode());
                    smap.put("subjectName", ss.getSubjectName());
                    smap.put("credits", ss.getCredits());
                    smap.put("theoryHours", ss.getTheoryHours());
                    smap.put("practicalHours", ss.getPracticalHours());
                    smap.put("type", ss.getType());
                    smap.put("unitTitles", ss.getUnitTitles());
                    smap.put("rawContent", ss.getRawContent());
                    subjList.add(smap);
                }
                metadata.put("detectedSubjects", subjList);
            });
        }

        return AcademicResourceDto.builder()
                .id(fs.getId())
                .fileName(fs.getFileName())
                .fileType(fs.getFileType())
                .documentUrl("/api/v1/academic-resources/" + fs.getId() + "/download")
                .uploadedBy(uploaderName.trim())
                .uploadedAt(fs.getUploadedAt())
                .metadata(metadata)
                .build();
    }
}
