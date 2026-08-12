package com.acronexus.service.impl;

import com.acronexus.dto.*;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.AiService;
import com.acronexus.service.TimetableAssignmentService;
import com.acronexus.dto.ai.AiGenericRequest;
import com.acronexus.dto.ai.AiGenericResponse;
import com.acronexus.util.NameNormalizer;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimetableAssignmentServiceImpl implements TimetableAssignmentService {

    private final TimetableRepository timetableRepository;
    private final FacultyRepository facultyRepository;
    private final SubjectRepository subjectRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final UserRepository userRepository;
    private final FileStorageRepository fileStorageRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;
    private final StudentRepository studentRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final LectureMaterialRepository lectureMaterialRepository;
    private final SubjectAnnouncementRepository subjectAnnouncementRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;
    private final StudentAttendanceHistoryRepository studentAttendanceHistoryRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final FacultyActivityRepository facultyActivityRepository;
    private final com.acronexus.service.ClassSubjectService classSubjectService;

    @Override
    public TimetableReviewReportDto performAiMatch(UUID timetableId, UUID requestedBy) {
        Timetable timetable = timetableRepository.findById(timetableId).or(() -> timetableRepository.findByFileId(timetableId))
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("Timetable not found"));
                
        FileStorage fileStorage = timetable.getFile();
        if (fileStorage == null || fileStorage.getDocumentUrl() == null) {
            throw new com.acronexus.exception.ResourceNotFoundException("No file attached to timetable");
        }

        // 1. Check Cache — Disabled temporarily to force fresh AI matching
        /*
        if (fileStorage.getAiMetadata() != null && !fileStorage.getAiMetadata().isBlank()
                && fileStorage.getAiMetadata().contains("-")) {
            try {
                TimetableReviewReportDto cached = objectMapper.readValue(fileStorage.getAiMetadata(), TimetableReviewReportDto.class);
                if (cached.getSubjectAssignments() != null && !cached.getSubjectAssignments().isEmpty()) {
                    String firstSid = cached.getSubjectAssignments().get(0).getSubjectId();
                    if (firstSid != null && firstSid.contains("-")) {
                        log.info("Returning cached AI metadata for timetable {}", timetableId);
                        return cached;
                    }
                }
                log.warn("Cached aiMetadata has unmapped IDs for timetable {}, re-parsing", timetableId);
            } catch (Exception e) {
                log.warn("Failed to parse cached aiMetadata for timetable {}, falling back to Groq", timetableId);
            }
        }
        */


        // Load DB master data for matching (NOT sent to AI)
        List<Faculty> faculties = facultyRepository.findAll();
        List<Subject> subjects = subjectRepository.findByIsActiveTrue();

        // ============================================
        // Call FastAPI to extract RAW names from PDF
        // ============================================
        String jsonContent = null;
        try {
            File pdfFile = new File(fileStorage.getDocumentUrl().replace("file://", "").replace("%20", " "));
            if (!pdfFile.exists()) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND,
                        "The physical PDF file could not be found on the server. Please upload the timetable again."
                );
            }
            String absolutePath = pdfFile.getAbsolutePath();
            log.info("Sending absolute path to FastAPI: {}", absolutePath);
            jsonContent = aiService.extractTimetable(absolutePath);
        } catch (Exception e) {
            log.error("AI extraction failed via FastAPI: {}", e.getMessage(), e);
            throw new RuntimeException("AI Timetable Extraction failed: " + e.getMessage());
        }
        
        if (jsonContent == null || jsonContent.isBlank()) {
            throw new RuntimeException("AI returned empty response.");
        }

        // ============================================
        // PHASE 2: Fuzzy-match AI-extracted names against DB
        // (Only timetable-mentioned entities get matched)
        // ============================================
        try {
            jsonContent = repairTruncatedJson(jsonContent);
            System.out.println("\n\n====================================================");
            System.out.println("JSON RECEIVED BY SPRING");
            System.out.println("====================================================");
            System.out.println(jsonContent);
            System.out.println("\n====================================================\n\n");
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(jsonContent);
            
            TimetableReviewReportDto dto = new TimetableReviewReportDto();
            dto.setFileName(fileStorage.getFileName());
            dto.setUploadedAt(timetable.getUploadedAt().toString());
            dto.setDepartment(timetable.getAcroClass().getDepartment().getName());
            dto.setDegree(timetable.getAcroClass().getDegreeProgram().getName());
            dto.setAcademicYear(timetable.getAcademicYear().getYear());
            dto.setClassName(timetable.getAcroClass().getName());
            
            if (timetable.getBatch() != null && !timetable.getBatch().isBlank()) {
                dto.setBatch(timetable.getBatch());
            } else {
                dto.setBatch(timetable.getAcroClass().getName());
            }
            
            dto.setSemester(timetable.getSemester().getSemesterNumber());
            
            List<ParsedSubjectAssignmentDto> subjectAssignments = new ArrayList<>();
            List<ParsedCoordinatorAssignmentDto> coordinatorAssignments = new ArrayList<>();
            List<ParsedSlotDto> timetableSlots = new ArrayList<>();
            List<String> unknowns = new ArrayList<>();
            
            // Track unique faculty-subject pairs to avoid duplicates
            Set<String> seenPairs = new HashSet<>();
            
            // Process teachings (now subjects): fuzzy-match each extracted name
            com.fasterxml.jackson.databind.JsonNode teachings = root.get("subjects");
            if (teachings != null && teachings.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode t : teachings) {
                    String extractedFaculty = t.has("faculty") ? t.get("faculty").asText() : null;
                    String extractedSubjectCode = t.has("subjectCode") && !t.get("subjectCode").isNull() ? t.get("subjectCode").asText() : null;
                    String extractedSubject = t.has("subjectName") ? t.get("subjectName").asText() : null;
                    String extractedSubjectType = t.has("subjectType") && !t.get("subjectType").isNull() ? t.get("subjectType").asText() : null;
                    
                    if (extractedFaculty == null || extractedFaculty.trim().isEmpty() || extractedFaculty.equalsIgnoreCase("null")) {
                        extractedFaculty = "Needs Manual Review";
                    }
                    if (extractedSubject == null || extractedSubject.trim().isEmpty() || extractedSubject.equalsIgnoreCase("null")) {
                        if (extractedSubjectCode != null && !extractedSubjectCode.trim().isEmpty() && !extractedSubjectCode.equalsIgnoreCase("null")) {
                            extractedSubject = extractedSubjectCode; // Fallback to code if name is missing
                        } else {
                            extractedSubject = "Unknown Subject";
                        }
                    }
                    
                    String matchedFacultyId = fuzzyMatchFaculty(extractedFaculty, faculties);
                    
                    ParsedSubjectAssignmentDto sa = new ParsedSubjectAssignmentDto();
                    sa.setClassId(timetable.getAcroClass().getId().toString());
                    sa.setClassName(timetable.getAcroClass().getName());
                    
                    sa.setOriginalFacultyName(extractedFaculty);
                    sa.setOriginalSubjectName(extractedSubject);
                    sa.setOriginalSubjectCode(extractedSubjectCode);
                    sa.setOriginalSubjectType(extractedSubjectType);
                    
                    if (matchedFacultyId != null) {
                        sa.setFacultyId(matchedFacultyId);
                        faculties.stream().filter(f -> f.getUser().getId().toString().equals(matchedFacultyId))
                            .findFirst().ifPresent(f -> sa.setMatchedFacultyName(f.getUser().getFirstName() + " " + f.getUser().getLastName()));
                    } else {
                        unknowns.add("Faculty not found in DB: " + extractedFaculty);
                    }
                    
                    // Subject matching disabled per requirements. Keep only original subject name/code.
                    sa.setSubjectId(null);
                    sa.setMatchedSubjectName(null);
                    sa.setSubjectCode(extractedSubjectCode);
                    
                    subjectAssignments.add(sa);
                }
            }
            
            // Process coordinator
            com.fasterxml.jackson.databind.JsonNode coordNode = root.get("coordinator");
            if (coordNode != null && !coordNode.isNull() && !coordNode.asText().isBlank() 
                    && !"null".equalsIgnoreCase(coordNode.asText())) {
                String extractedCoord = coordNode.asText();
                String matchedCoordId = fuzzyMatchFaculty(extractedCoord, faculties);
                
                ParsedCoordinatorAssignmentDto ca = new ParsedCoordinatorAssignmentDto();
                ca.setClassName(timetable.getAcroClass().getName());
                ca.setSemester("Semester " + timetable.getSemester().getSemesterNumber());
                ca.setAcademicYear(timetable.getAcademicYear().getYear());
                ca.setBatch(dto.getBatch());
                
                ca.setOriginalCoordinatorName(extractedCoord);
                
                if (matchedCoordId != null) {
                    ca.setCoordinatorId(matchedCoordId);
                    faculties.stream().filter(f -> f.getUser().getId().toString().equals(matchedCoordId))
                        .findFirst().ifPresent(f -> ca.setMatchedCoordinatorName(f.getUser().getFirstName() + " " + f.getUser().getLastName()));
                } else {
                    unknowns.add("Coordinator not found in DB: " + extractedCoord);
                }
                coordinatorAssignments.add(ca);
            }
            
            com.fasterxml.jackson.databind.JsonNode slots = root.get("slots");
            if (slots != null && slots.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode s : slots) {
                    ParsedSlotDto slotDto = new ParsedSlotDto();
                    slotDto.setDayOfWeek(s.has("day") ? s.get("day").asText() : "");
                    slotDto.setTimeSlot(s.has("time") ? s.get("time").asText() : "");
                    slotDto.setRoomNumber(s.has("room") && !s.get("room").isNull() ? s.get("room").asText() : "");
                    
                    String slotFaculty = s.has("faculty") && !s.get("faculty").isNull() ? s.get("faculty").asText() : null;
                    slotDto.setOriginalFacultyName(slotFaculty);
                    if (slotFaculty != null) {
                        slotDto.setFacultyId(fuzzyMatchFaculty(slotFaculty, faculties));
                    }
                    
                    slotDto.setOriginalSubjectName(s.has("subjectName") && !s.get("subjectName").isNull() ? s.get("subjectName").asText() : "");
                    slotDto.setOriginalSubjectCode(s.has("subjectCode") && !s.get("subjectCode").isNull() ? s.get("subjectCode").asText() : "");
                    
                    timetableSlots.add(slotDto);
                }
            }
            
            dto.setSubjectAssignments(subjectAssignments);
            dto.setCoordinatorAssignments(coordinatorAssignments);
            dto.setTimetableSlots(timetableSlots);
            dto.setUnknowns(unknowns.isEmpty() ? null : unknowns);
            
            return dto;
        } catch (Exception e) {
            log.error("Failed to parse AI Timetable response: " + e.getMessage(), e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void confirmAssignments(UUID timetableId, TimetableReviewReportDto reviewDto, UUID requestedBy) {
        Timetable timetable = timetableRepository.findById(timetableId).or(() -> timetableRepository.findByFileId(timetableId))
                .orElseThrow(() -> new RuntimeException("Timetable not found"));

        User creator = userRepository.findById(requestedBy).orElse(null);

        AcroClass targetClass = timetable.getAcroClass();
        AcademicYear targetYear = timetable.getAcademicYear();
        Semester targetSemester = timetable.getSemester();
        Integer newSemNumber = targetSemester.getSemesterNumber();
        String targetBatch = timetable.getBatch();
        Department targetDepartment = targetClass.getDepartment();

        log.info("--- [AI MATCH CONFIRM & ASSIGN] Starting dynamic workflow for Class: {}, Semester: {}, Batch: {} ---", 
                 targetClass.getName(), newSemNumber, targetBatch);

        // 1. COMPLETE PREVIOUS SEMESTER CLEANUP
        cleanupPreviousSemesterWorkspace(targetClass, newSemNumber);

        // 2. DEACTIVATE EXISTING SLOTS FOR THIS TIMETABLE
        List<TimetableSlot> existingSlots = timetableSlotRepository.findByTimetableId(timetableId);
        for (TimetableSlot ts : existingSlots) {
            ts.setIsActive(false);
            timetableSlotRepository.save(ts);
        }

        // 3. PROCESS SUBJECT CARDS (NEW SEMESTER INITIALIZATION)
        if (reviewDto.getSubjectAssignments() != null) {
            for (ParsedSubjectAssignmentDto sm : reviewDto.getSubjectAssignments()) {
                Subject resolvedSubject = resolveOrCreateSubject(sm.getOriginalSubjectCode(), sm.getOriginalSubjectName(), targetDepartment);
                
                List<ClassSubject> existingClassSubjects = classSubjectRepository.findByAcroClassIdAndIsActiveTrue(targetClass.getId())
                    .stream()
                    .filter(cs -> cs.getSubject().getId().equals(resolvedSubject.getId()) &&
                                  cs.getSemester().getId().equals(targetSemester.getId()) &&
                                  cs.getAcademicYear().getId().equals(targetYear.getId()))
                    .collect(java.util.stream.Collectors.toList());
                
                ClassSubject cs;
                if (!existingClassSubjects.isEmpty()) {
                    cs = existingClassSubjects.get(0);
                    log.info("Updating existing ClassSubject for subject={}", resolvedSubject.getName());
                } else {
                    cs = new ClassSubject();
                    cs.setAcroClass(targetClass);
                    cs.setAcademicYear(targetYear);
                    cs.setSemester(targetSemester);
                    cs.setSubject(resolvedSubject);
                    cs.setEffectiveFrom(LocalDate.now());
                    cs.setIsActive(true);
                    cs.setCreatedBy(creator);
                    log.info("Initializing fresh ClassSubject for subject={}", resolvedSubject.getName());
                }
                
                Faculty faculty = null;
                if (sm.getFacultyId() != null && isValidUUID(sm.getFacultyId())) {
                    faculty = facultyRepository.findById(UUID.fromString(sm.getFacultyId())).orElse(null);
                }
                
                cs.setFaculty(faculty);
                cs = classSubjectRepository.save(cs);

                // Synchronize with any uploaded Academic Syllabus
                try {
                    classSubjectService.linkSyllabusToClassSubject(cs);
                } catch (Exception e) {
                    log.warn("Syllabus linking failed for subject {}: {}", resolvedSubject.getName(), e.getMessage());
                }
            }
        }

        // 4. PROCESS COORDINATOR ASSIGNMENT
        if (reviewDto.getCoordinatorAssignments() != null && !reviewDto.getCoordinatorAssignments().isEmpty()) {
            ParsedCoordinatorAssignmentDto cm = reviewDto.getCoordinatorAssignments().get(0);
            User coordinator = null;
            if (cm.getCoordinatorId() != null && isValidUUID(cm.getCoordinatorId())) {
                coordinator = userRepository.findById(UUID.fromString(cm.getCoordinatorId())).orElse(null);
            }
            
            List<CoordinatorAssignment> existingCoords = coordinatorAssignmentRepository.findByClassNameAndIsActiveTrue(targetClass.getName())
                .stream()
                .filter(ca -> java.util.Objects.equals(ca.getAcademicYear(), targetYear.getYear()) &&
                              java.util.Objects.equals(ca.getSemester(), "Semester " + newSemNumber) &&
                              java.util.Objects.equals(ca.getBatch(), targetBatch))
                .collect(java.util.stream.Collectors.toList());
                
            CoordinatorAssignment ca;
            if (!existingCoords.isEmpty()) {
                ca = existingCoords.get(0);
                log.info("Updating existing CoordinatorAssignment for class={}, batch={}", targetClass.getName(), targetBatch);
            } else {
                ca = new CoordinatorAssignment();
                ca.setClassName(targetClass.getName());
                ca.setAcademicYear(targetYear.getYear());
                ca.setSemester("Semester " + newSemNumber);
                ca.setBatch(targetBatch);
                ca.setEffectiveFrom(LocalDate.now());
                ca.setIsActive(true);
                ca.setCreatedBy(creator);
                log.info("Creating NEW CoordinatorAssignment for class={}, batch={}", targetClass.getName(), targetBatch);
            }
            
            ca.setCoordinator(coordinator);
            coordinatorAssignmentRepository.save(ca);

            if (coordinator != null && "FACULTY".equals(coordinator.getRole().name())) {
                log.info("Promoting explicitly selected faculty {} to COORDINATOR role.", coordinator.getEmail());
                coordinator.setRole(com.acronexus.entity.UserRole.COORDINATOR);
                userRepository.save(coordinator);
            }
        }
        
        // 5. INSERT NEW TIMETABLE SLOTS
        if (reviewDto.getTimetableSlots() != null) {
            for (ParsedSlotDto slotDto : reviewDto.getTimetableSlots()) {
                TimetableSlot ts = new TimetableSlot();
                ts.setTimetable(timetable);
                if (slotDto.getFacultyId() != null && isValidUUID(slotDto.getFacultyId())) {
                    ts.setFaculty(facultyRepository.findById(UUID.fromString(slotDto.getFacultyId())).orElse(null));
                }
                ts.setSubject(resolveOrCreateSubject(slotDto.getOriginalSubjectCode(), slotDto.getOriginalSubjectName(), targetDepartment)); 
                ts.setDayOfWeek(slotDto.getDayOfWeek());
                ts.setTimeSlot(slotDto.getTimeSlot());
                ts.setRoomNumber(slotDto.getRoomNumber());
                ts.setIsActive(true);
                timetableSlotRepository.save(ts);
            }
        }

        // 6. MARK THIS TIMETABLE AS THE SINGLE ACTIVE SOURCE OF TRUTH FOR THIS CLASS
        List<Timetable> otherTimetables = timetableRepository.findAll()
            .stream()
            .filter(t -> t.getAcroClass() != null && 
                        (t.getAcroClass().getId().equals(targetClass.getId()) || 
                         (t.getAcroClass().getName() != null && targetClass.getName() != null && t.getAcroClass().getName().trim().equalsIgnoreCase(targetClass.getName().trim()))) && 
                         !t.getId().equals(timetable.getId()))
            .collect(Collectors.toList());
        for (Timetable t : otherTimetables) {
            t.setIsActive(false);
            timetableRepository.save(t);
        }
        timetable.setIsActive(true);
        timetableRepository.save(timetable);

        // 7. AUTOMATIC STUDENT ASSIGNMENT & SEMESTER PROMOTION
        performDynamicStudentAssignmentAndPromotion(targetDepartment, targetBatch, targetClass, targetYear, targetSemester, creator);
        log.info("--- [AI MATCH CONFIRM & ASSIGN] Successfully completed workflow for Class: {} ---", targetClass.getName());
    }

    private void cleanupPreviousSemesterWorkspace(AcroClass targetClass, Integer newSemNumber) {
        log.info("Cleaning up previous semester and superseded workspaces for Class: {} prior to Semester {}", targetClass.getName(), newSemNumber);

        String targetName = targetClass.getName() != null ? targetClass.getName().trim().toLowerCase() : "";
        String targetSec = targetClass.getSection() != null ? targetClass.getSection().trim().toLowerCase() : "";

        List<ClassSubject> allOldCards = classSubjectRepository.findAll()
                .stream()
                .filter(cs -> cs.getAcroClass() != null)
                .filter(cs -> {
                    boolean idMatch = cs.getAcroClass().getId().equals(targetClass.getId());
                    boolean nameMatch = !targetName.isEmpty() && cs.getAcroClass().getName() != null && cs.getAcroClass().getName().trim().toLowerCase().equals(targetName);
                    boolean secMatch = !targetSec.isEmpty() && cs.getAcroClass().getSection() != null && cs.getAcroClass().getSection().trim().toLowerCase().equals(targetSec);
                    return idMatch || nameMatch || secMatch;
                })
                .collect(Collectors.toList());

        if (!allOldCards.isEmpty()) {
            List<UUID> oldCsIds = allOldCards.stream().map(ClassSubject::getId).collect(Collectors.toList());
            log.info("Deleting complete academic workspace for {} existing/previous Subject Cards of class {}", oldCsIds.size(), targetClass.getName());

            Set<UUID> fileIdsToDelete = new HashSet<>();
            fileIdsToDelete.addAll(assignmentSubmissionRepository.findFileIdsByClassSubjectIds(oldCsIds));
            fileIdsToDelete.addAll(assignmentRepository.findFileIdsByClassSubjectIds(oldCsIds));
            fileIdsToDelete.addAll(lectureMaterialRepository.findFileIdsByClassSubjectIds(oldCsIds));

            assignmentSubmissionRepository.deleteByClassSubjectIds(oldCsIds);
            assignmentRepository.deleteByClassSubjectIds(oldCsIds);
            lectureMaterialRepository.deleteByClassSubjectIds(oldCsIds);
            subjectAnnouncementRepository.deleteByClassSubjectIds(oldCsIds);
            studentAttendanceHistoryRepository.deleteByClassSubjectIds(oldCsIds);
            studentAttendanceRepository.deleteByClassSubjectIds(oldCsIds);
            attendanceSessionRepository.deleteByClassSubjectIds(oldCsIds);
            quizAttemptRepository.deleteByClassSubjectIds(oldCsIds);
            quizQuestionRepository.deleteByClassSubjectIds(oldCsIds);
            quizRepository.deleteByClassSubjectIds(oldCsIds);
            facultyActivityRepository.deleteByClassSubjectIds(oldCsIds);
            classSubjectRepository.deleteByIdIn(oldCsIds);

            for (UUID fileId : fileIdsToDelete) {
                if (fileId != null) {
                    fileStorageRepository.findById(fileId).ifPresent(file -> {
                        if (file.getDocumentUrl() != null) {
                            try {
                                java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(file.getDocumentUrl()));
                            } catch (Exception e) {
                                log.warn("Failed to delete physical file: {}", e.getMessage());
                            }
                        }
                        fileStorageRepository.delete(file);
                    });
                }
            }
            log.info("Finished deleting previous semester Subject Cards and operational data.");
        }

        List<CoordinatorAssignment> oldCoords = coordinatorAssignmentRepository.findAll()
                .stream()
                .filter(ca -> ca.getClassName() != null && !targetName.isEmpty() && ca.getClassName().trim().toLowerCase().equals(targetName))
                .collect(Collectors.toList());
        if (!oldCoords.isEmpty()) {
            coordinatorAssignmentRepository.deleteAll(oldCoords);
            log.info("Deleted {} previous CoordinatorAssignments for class {}", oldCoords.size(), targetClass.getName());
        }
    }

    private void performDynamicStudentAssignmentAndPromotion(Department targetDept, String targetBatch, AcroClass targetClass, 
                                                             AcademicYear targetYear, Semester targetSemester, User creator) {
        log.info("Executing dynamic student assignment and promotion for Dept: {}, Batch: {}, Class/Section: {}, New Sem: {}", 
                 targetDept != null ? targetDept.getName() : "Any", targetBatch, targetClass.getName(), targetSemester.getSemesterNumber());

        List<Student> allStudents = studentRepository.findAll();
        Integer newSemNumber = targetSemester.getSemesterNumber();
        int matchedCount = 0;
        int promotedCount = 0;

        String targetName = targetClass.getName() != null ? targetClass.getName().trim().toLowerCase() : "";
        String targetSec = targetClass.getSection() != null ? targetClass.getSection().trim().toLowerCase() : "";

        List<StudentEnrollment> existingEnrollments = studentEnrollmentRepository.findAll();
        Set<UUID> alreadyEnrolledStudentIds = existingEnrollments.stream()
            .filter(se -> se.getAcroClass() != null)
            .filter(se -> se.getAcroClass().getId().equals(targetClass.getId()) ||
                         (se.getAcroClass().getName() != null && !targetName.isEmpty() && se.getAcroClass().getName().trim().toLowerCase().equals(targetName)) ||
                         (se.getAcroClass().getSection() != null && !targetSec.isEmpty() && se.getAcroClass().getSection().trim().toLowerCase().equals(targetSec)))
            .map(se -> se.getStudent().getId())
            .collect(Collectors.toSet());

        for (Student student : allStudents) {
            boolean classMatches = false;

            if (alreadyEnrolledStudentIds.contains(student.getId())) {
                classMatches = true;
            } else {
                String stCourse = student.getCourse() != null ? student.getCourse().trim().toLowerCase() : "";
                String stSec = student.getSection() != null ? student.getSection().trim().toLowerCase() : "";

                if (!stCourse.isEmpty() && !targetName.isEmpty() && (stCourse.equals(targetName) || stCourse.contains(targetName) || targetName.contains(stCourse))) {
                    classMatches = true;
                } else if (!stSec.isEmpty() && !targetSec.isEmpty() && (stSec.equals(targetSec) || stSec.contains(targetSec) || targetSec.contains(stSec))) {
                    classMatches = true;
                } else if (!stSec.isEmpty() && !targetName.isEmpty() && (stSec.equals(targetName) || stSec.contains(targetName) || targetName.contains(stSec))) {
                    classMatches = true;
                }
            }

            if (!classMatches) continue;

            matchedCount++;

            int currentSemNum = 0;
            try {
                if (student.getCurrentSemester() != null && !student.getCurrentSemester().isBlank()) {
                    currentSemNum = Integer.parseInt(student.getCurrentSemester().replaceAll("[^0-9]", ""));
                }
            } catch (Exception e) {
                currentSemNum = 0;
            }

            if (student.getUser() != null && targetDept != null) {
                if (student.getUser().getDepartment() == null || !student.getUser().getDepartment().getId().equals(targetDept.getId())) {
                    student.getUser().setDepartment(targetDept);
                    userRepository.save(student.getUser());
                }
            }

            boolean isPromotion = (newSemNumber > currentSemNum);
            if (isPromotion) promotedCount++;

            student.setCurrentSemester(String.valueOf(newSemNumber));
            student.setCourse(targetClass.getName());
            student.setSection(targetClass.getSection() != null && !targetClass.getSection().isBlank() ? targetClass.getSection() : targetClass.getName());
            if (targetBatch != null && !targetBatch.isBlank()) {
                student.setBatchYear(targetBatch);
            }
            studentRepository.save(student);

            List<StudentEnrollment> studentEnrolls = existingEnrollments.stream()
                .filter(se -> se.getStudent() != null && se.getStudent().getId().equals(student.getId()))
                .collect(Collectors.toList());

            boolean needNewEnrollment = true;
            for (StudentEnrollment se : studentEnrolls) {
                if (Boolean.TRUE.equals(se.getIsActive())) {
                    if (se.getAcroClass().getId().equals(targetClass.getId()) &&
                        se.getAcademicYear().getId().equals(targetYear.getId()) &&
                        se.getSemester().getId().equals(targetSemester.getId())) {
                        needNewEnrollment = false;
                    } else {
                        se.setIsActive(false);
                        se.setEffectiveTo(LocalDate.now());
                        studentEnrollmentRepository.save(se);
                    }
                }
            }

            if (needNewEnrollment) {
                Optional<StudentEnrollment> termEnrollment = studentEnrollmentRepository
                  .findFirstByStudentIdAndAcademicYearIdAndSemesterIdOrderByIdDesc(student.getId(), targetYear.getId(), targetSemester.getId());
                if (termEnrollment.isPresent()) {
                    StudentEnrollment e = termEnrollment.get();
                    e.setAcroClass(targetClass);
                    e.setIsActive(true);
                    e.setEffectiveTo(null);
                    studentEnrollmentRepository.save(e);
                } else {
                    StudentEnrollment newEnrollment = new StudentEnrollment();
                    newEnrollment.setStudent(student);
                    newEnrollment.setAcroClass(targetClass);
                    newEnrollment.setAcademicYear(targetYear);
                    newEnrollment.setSemester(targetSemester);
                    newEnrollment.setEffectiveFrom(LocalDate.now());
                    newEnrollment.setIsActive(true);
                    newEnrollment.setCreatedBy(creator);
                    studentEnrollmentRepository.save(newEnrollment);
                }
            }
        }
        log.info("Dynamic Student Automation complete! Checked={}, Matched & Synchronized={}, Promoted={}", 
                 allStudents.size(), matchedCount, promotedCount);
    }


    private String fuzzyMatchFaculty(String extractedName, List<Faculty> faculties) {
        if (extractedName == null || extractedName.isBlank()) return null;

        for (Faculty f : faculties) {
            if (f.getUser() == null) continue;
            String dbName = f.getUser().getFirstName() + " " + f.getUser().getLastName();
            if (NameNormalizer.fuzzyMatch(extractedName, dbName)) {
                return f.getUser().getId().toString();
            }
        }
        return null;
    }



    private boolean isValidUUID(String value) {
        if (value == null || !value.contains("-")) return false;
        try {
            UUID.fromString(value);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private Subject resolveOrCreateSubject(String code, String name, Department department) {
        if (name == null || name.isBlank()) return null;
        if (code == null || code.isBlank()) {
            code = "SUB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        
        // Check if exists
        try {
            List<Subject> existing = subjectRepository.findByIsActiveTrue();
            for (Subject s : existing) {
                if (s.getCode().equalsIgnoreCase(code)) {
                    // Update name to exactly match the timetable if it differs (to respect "display exactly as written")
                    if (!s.getName().equals(name)) {
                        s.setName(name);
                        subjectRepository.save(s);
                    }
                    return s;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to lookup subject by code {}: {}", code, e.getMessage());
        }
        
        // Create new
        Subject s = new Subject();
        s.setCode(code);
        s.setName(name);
        s.setDepartment(department);
        s.setIsActive(true);
        s.setCredits(0);
        return subjectRepository.save(s);
    }

    /**
     * Attempt to repair truncated JSON from the AI by closing open arrays/objects.
     */
    private String repairTruncatedJson(String json) {
        if (json == null) return json;
        // Count open/close braces/brackets
        int openBraces = 0, openBrackets = 0;
        boolean inString = false;
        char prev = 0;
        for (char c : json.toCharArray()) {
            if (c == '"' && prev != '\\') inString = !inString;
            if (!inString) {
                if (c == '{') openBraces++;
                else if (c == '}') openBraces--;
                else if (c == '[') openBrackets++;
                else if (c == ']') openBrackets--;
            }
            prev = c;
        }
        if (openBraces == 0 && openBrackets == 0) return json; // balanced
        
        log.warn("AI JSON is truncated (unclosed: {} braces, {} brackets). Attempting repair.", openBraces, openBrackets);
        
        // If we're inside a string, close it
        if (inString) json += "\"";
        
        // Remove the last incomplete element (after the last comma)
        int lastComma = json.lastIndexOf(',');
        int lastCloseBracket = json.lastIndexOf(']');
        if (lastComma > lastCloseBracket) {
            json = json.substring(0, lastComma);
        }
        
        // Re-count
        openBraces = 0; openBrackets = 0; inString = false; prev = 0;
        for (char c : json.toCharArray()) {
            if (c == '"' && prev != '\\') inString = !inString;
            if (!inString) {
                if (c == '{') openBraces++;
                else if (c == '}') openBraces--;
                else if (c == '[') openBrackets++;
                else if (c == ']') openBrackets--;
            }
            prev = c;
        }
        
        // Close outstanding brackets then braces
        StringBuilder sb = new StringBuilder(json);
        for (int i = 0; i < openBrackets; i++) sb.append(']');
        for (int i = 0; i < openBraces; i++) sb.append('}');
        
        return sb.toString();
    }
}
