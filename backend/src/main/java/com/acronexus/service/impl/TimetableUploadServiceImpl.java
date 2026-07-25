package com.acronexus.service.impl;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.TimetableVersionDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.TimetableUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import com.acronexus.service.AiService;
import com.acronexus.dto.ai.AiAnalyticsRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimetableUploadServiceImpl implements TimetableUploadService {

    private final DepartmentRepository departmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;
    private final AcroClassRepository acroClassRepository;
    private final TimetableRepository timetableRepository;
    private final FileStorageRepository fileStorageRepository;
    private final UserRepository userRepository;
    private final DegreeProgramRepository degreeProgramRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final AiService aiService;

    private static final String UPLOAD_DIR = "uploads/timetables/";

    @Override
    @Transactional
    public ApiResponse<?> uploadTimetable(MultipartFile file, String departmentName, String academicYearStr, String semesterName, String className, String batchName, UUID uploadedBy) {
        User user = userRepository.findById(uploadedBy)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Validate Inputs
        Department department = departmentRepository.findAll().stream()
                .filter(d -> d.getName().equalsIgnoreCase(departmentName))
                .findFirst()
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setName(departmentName);
                    return departmentRepository.save(d);
                });

        AcademicYear academicYear = academicYearRepository.findByYear(academicYearStr)
                .orElseGet(() -> {
                    AcademicYear a = new AcademicYear();
                    a.setYear(academicYearStr);
                    a.setStartDate(java.time.LocalDate.now());
                    a.setEndDate(java.time.LocalDate.now().plusYears(1));
                    a.setIsActive(true);
                    return academicYearRepository.save(a);
                });

        int semNum = 1;
        try { semNum = Integer.parseInt(semesterName.replace("Semester ", "").trim()); } catch (Exception ignored) {}
        final int fSemNum = semNum;
        Semester semester = semesterRepository.findBySemesterNumberAndAcademicYearId(semNum, academicYear.getId())
                .orElseGet(() -> {
                    Semester s = new Semester();
                    s.setSemesterNumber(fSemNum);
                    s.setAcademicYear(academicYear);
                    s.setStartDate(java.time.LocalDate.now());
                    s.setEndDate(java.time.LocalDate.now().plusMonths(6));
                    s.setIsActive(true);
                    return semesterRepository.save(s);
                });

        AcroClass acroClass = acroClassRepository.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(className))
                .findFirst()
                .orElseGet(() -> {
                    AcroClass c = new AcroClass();
                    c.setName(className);
                    c.setDepartment(department);
                    
                    com.acronexus.entity.DegreeProgram dp = degreeProgramRepository.findAll().stream()
                            .findFirst()
                            .orElseGet(() -> {
                                com.acronexus.entity.DegreeProgram newDp = new com.acronexus.entity.DegreeProgram();
                                newDp.setName("B.Tech");
                                newDp.setDurationYears(4);
                                newDp.setIsActive(true);
                                return degreeProgramRepository.save(newDp);
                            });
                    c.setDegreeProgram(dp);
                    return acroClassRepository.save(c);
                });

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!originalFilename.endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are currently supported for Timetable Uploads.");
        }

        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            // PDF is valid if it loads without throwing an exception
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid PDF file structure or corrupted file.");
        }

        // Deactivate older versions
        List<Timetable> existingVersions = timetableRepository
                .findByAcroClassAndAcademicYearAndSemester(acroClass, academicYear, semester);

        int nextVersion = 1;
        if (!existingVersions.isEmpty()) {
            nextVersion = existingVersions.stream().mapToInt(Timetable::getVersionNumber).max().orElse(0) + 1;
            for (Timetable t : existingVersions) {
                t.setIsActive(false);
                timetableRepository.save(t);
            }
        }

        // Save File
        FileStorage fileStorage = saveFile(file, user);

        // Create new Timetable version
        Timetable newVersion = new Timetable();
        newVersion.setAcroClass(acroClass);
        newVersion.setAcademicYear(academicYear);
        newVersion.setSemester(semester);
        newVersion.setBatch(batchName);
        newVersion.setVersionNumber(nextVersion);
        newVersion.setFile(fileStorage);
        newVersion.setIsActive(true);
        newVersion.setUploadedBy(user);

        timetableRepository.save(newVersion);

        TimetableVersionDto dto = mapToDto(newVersion);

        return ApiResponse.success("Timetable uploaded successfully as Version " + nextVersion, dto);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<?> getAllTimetables() {
        List<Timetable> timetables = timetableRepository.findByIsActiveTrueOrderByUploadedAtDesc();
        List<TimetableVersionDto> dtoList = timetables.stream().map(this::mapToDto).collect(Collectors.toList());
        return ApiResponse.success("Timetables retrieved successfully", dtoList);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<?> getVersionHistory(UUID classId, UUID academicYearId, UUID semesterId) {
        List<Timetable> versions = timetableRepository
                .findByAcroClassIdAndAcademicYearIdAndSemesterIdOrderByVersionNumberDesc(
                        classId, academicYearId, semesterId);

        List<TimetableVersionDto> dtoList = versions.stream().map(this::mapToDto).collect(Collectors.toList());

        return ApiResponse.success("Version history retrieved", dtoList);
    }

    private TimetableVersionDto mapToDto(Timetable v) {
        TimetableVersionDto dto = new TimetableVersionDto();
        dto.setId(v.getId());
        dto.setVersionNumber(v.getVersionNumber());
        dto.setIsActive(v.getIsActive());
        if (v.getFile() != null) {
            dto.setFileName(v.getFile().getFileName());
            dto.setFileType(v.getFile().getFileType());
            dto.setUploadedAt(v.getFile().getUploadedAt());
            dto.setIsDeleted(v.getFile().getIsDeleted());
            if (v.getFile().getUploadedBy() != null) {
                dto.setUploadedBy(v.getFile().getUploadedBy().getFirstName() + " " + v.getFile().getUploadedBy().getLastName());
            }
        }
        if (v.getAcroClass() != null) {
            dto.setClassName(v.getAcroClass().getName());
            if (v.getAcroClass().getDepartment() != null) {
                dto.setDepartment(v.getAcroClass().getDepartment().getName());
            }
            if (v.getAcroClass().getDegreeProgram() != null) {
                dto.setDegree(v.getAcroClass().getDegreeProgram().getName());
            }
        }
        if (v.getAcademicYear() != null) {
            dto.setAcademicYear(v.getAcademicYear().getYear());
        }
        if (v.getSemester() != null) {
            dto.setSemester("Semester " + v.getSemester().getSemesterNumber());
        }
        if (v.getBatch() != null && !v.getBatch().isBlank()) {
            dto.setBatch(v.getBatch());
        } else {
            dto.setBatch(v.getAcroClass() != null ? v.getAcroClass().getName() : "-");
        }
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadVersion(UUID versionId) {
        Timetable version = timetableRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Version not found"));

        if (version.getFile() == null || version.getFile().getDocumentUrl() == null) {
            throw new IllegalArgumentException("File not found for this version");
        }

        try {
            Path path = Paths.get(version.getFile().getDocumentUrl());
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Error reading file", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getFileName(UUID versionId) {
        Timetable version = timetableRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Version not found"));
        if (version.getFile() != null) {
            return version.getFile().getFileName();
        }
        return "timetable.pdf";
    }

    @Override
    @Transactional
    public ApiResponse<?> setActiveVersion(UUID versionId) {
        Timetable versionToActivate = timetableRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Version not found"));

        List<Timetable> allVersions = timetableRepository
                .findByAcroClassAndAcademicYearAndSemester(
                        versionToActivate.getAcroClass(),
                        versionToActivate.getAcademicYear(),
                        versionToActivate.getSemester()
                );

        for (Timetable t : allVersions) {
            boolean isTarget = t.getId().equals(versionToActivate.getId());
            t.setIsActive(isTarget);
            timetableRepository.save(t);

            if (isTarget && t.getFile() != null && Boolean.TRUE.equals(t.getFile().getIsDeleted())) {
                t.getFile().setIsDeleted(false);
                fileStorageRepository.save(t.getFile());
            }
        }

        return ApiResponse.success("Version " + versionToActivate.getVersionNumber() + " is now active", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> softDeleteVersion(UUID versionId) {
        Timetable version = timetableRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Version not found"));

        // Hard delete slots and timetable
        timetableSlotRepository.findByTimetableId(version.getId()).forEach(timetableSlotRepository::delete);
        timetableRepository.delete(version);
        
        if (version.getFile() != null) {
            fileStorageRepository.delete(version.getFile());
        }

        return ApiResponse.success("Timetable hard deleted successfully", null);
    }

    private FileStorage saveFile(MultipartFile file, User user) {
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
            fs.setFileType(file.getContentType());
            fs.setUploadedBy(user);
            fs.setUploadedAt(ZonedDateTime.now());
            fs.setIsActive(true);
            fs.setIsDeleted(false);
            return fileStorageRepository.save(fs);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}
