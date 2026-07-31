package com.acronexus.service.impl;

import com.acronexus.dto.*;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.AiService;
import com.acronexus.service.TimetableAssignmentService;
import com.acronexus.dto.ai.AiGenericRequest;
import com.acronexus.dto.ai.AiGenericResponse;
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

        // Deactivate existing slots for this timetable (since they are tightly coupled to the timetable file)
        List<TimetableSlot> existingSlots = timetableSlotRepository.findByTimetableId(timetableId);
        for (TimetableSlot ts : existingSlots) {
            ts.setIsActive(false);
            timetableSlotRepository.save(ts);
        }

        // Process Subject Cards (ClassSubject) using Upsert
        if (reviewDto.getSubjectAssignments() != null) {
            for (ParsedSubjectAssignmentDto sm : reviewDto.getSubjectAssignments()) {
                Subject resolvedSubject = resolveOrCreateSubject(sm.getOriginalSubjectCode(), sm.getOriginalSubjectName(), timetable.getAcroClass().getDepartment());
                
                // Find existing ClassSubject for this class + subject + academic year + semester
                List<ClassSubject> existingClassSubjects = classSubjectRepository.findByAcroClassIdAndIsActiveTrue(timetable.getAcroClass().getId())
                    .stream()
                    .filter(cs -> cs.getSubject().getId().equals(resolvedSubject.getId()) &&
                                  cs.getSemester().getId().equals(timetable.getSemester().getId()) &&
                                  cs.getAcademicYear().getId().equals(timetable.getAcademicYear().getId()))
                    .collect(java.util.stream.Collectors.toList());
                
                ClassSubject cs;
                if (!existingClassSubjects.isEmpty()) {
                    cs = existingClassSubjects.get(0);
                    log.info("Updating existing ClassSubject for subject={}", resolvedSubject.getName());
                } else {
                    cs = new ClassSubject();
                    cs.setAcroClass(timetable.getAcroClass());
                    cs.setAcademicYear(timetable.getAcademicYear());
                    cs.setSemester(timetable.getSemester());
                    cs.setSubject(resolvedSubject);
                    cs.setEffectiveFrom(LocalDate.now());
                    cs.setIsActive(true);
                    cs.setCreatedBy(creator);
                    log.info("Creating new ClassSubject for subject={}", resolvedSubject.getName());
                }
                
                Faculty faculty = null;
                if (sm.getFacultyId() != null && isValidUUID(sm.getFacultyId())) {
                    faculty = facultyRepository.findById(UUID.fromString(sm.getFacultyId())).orElse(null);
                }
                
                // Save the ClassSubject with the assigned faculty (or null if Unassigned)
                cs.setFaculty(faculty);
                classSubjectRepository.save(cs);
            }
        }

        // Process Coordinator Assignments using Upsert
        if (reviewDto.getCoordinatorAssignments() != null && !reviewDto.getCoordinatorAssignments().isEmpty()) {
            // ONLY process the explicit Coordinator from the Review Popup Coordinator Section.
            // If the frontend somehow sent an array of faculties, we discard everything except the first actual explicitly mapped coordinator.
            ParsedCoordinatorAssignmentDto cm = reviewDto.getCoordinatorAssignments().get(0);
            
            User coordinator = null;
            if (cm.getCoordinatorId() != null && isValidUUID(cm.getCoordinatorId())) {
                coordinator = userRepository.findById(UUID.fromString(cm.getCoordinatorId())).orElse(null);
            }
            
            List<CoordinatorAssignment> existingCoords = coordinatorAssignmentRepository.findByClassNameAndIsActiveTrue(timetable.getAcroClass().getName())
                .stream()
                .filter(ca -> java.util.Objects.equals(ca.getAcademicYear(), timetable.getAcademicYear().getYear()) &&
                              java.util.Objects.equals(ca.getSemester(), "Semester " + timetable.getSemester().getSemesterNumber()) &&
                              java.util.Objects.equals(ca.getBatch(), timetable.getBatch()))
                .collect(java.util.stream.Collectors.toList());
                
            CoordinatorAssignment ca;
            if (!existingCoords.isEmpty()) {
                ca = existingCoords.get(0);
                log.info("Updating existing CoordinatorAssignment for class={}, batch={}, existingBatch={}", timetable.getAcroClass().getName(), timetable.getBatch(), ca.getBatch());
            } else {
                ca = new CoordinatorAssignment();
                ca.setClassName(timetable.getAcroClass().getName());
                ca.setAcademicYear(timetable.getAcademicYear().getYear());
                ca.setSemester("Semester " + timetable.getSemester().getSemesterNumber());
                ca.setBatch(timetable.getBatch());
                ca.setEffectiveFrom(LocalDate.now());
                ca.setIsActive(true);
                log.info("Creating NEW CoordinatorAssignment for class={}, batch={}", timetable.getAcroClass().getName(), timetable.getBatch());
                ca.setCreatedBy(creator);
            }
            
            ca.setCoordinator(coordinator);
            coordinatorAssignmentRepository.save(ca);

            // Promote to COORDINATOR role ONLY for the explicitly selected coordinator
            if (coordinator != null && "FACULTY".equals(coordinator.getRole().name())) {
                log.info("Promoting explicitly selected faculty {} to COORDINATOR role.", coordinator.getEmail());
                coordinator.setRole(com.acronexus.entity.UserRole.COORDINATOR);
                userRepository.save(coordinator);
            }
        }
        
        // Insert new Timetable Slots
        if (reviewDto.getTimetableSlots() != null) {
            for (ParsedSlotDto slotDto : reviewDto.getTimetableSlots()) {
                TimetableSlot ts = new TimetableSlot();
                ts.setTimetable(timetable);
                if (slotDto.getFacultyId() != null && isValidUUID(slotDto.getFacultyId()))
                    ts.setFaculty(facultyRepository.findById(UUID.fromString(slotDto.getFacultyId())).orElse(null));
                
                ts.setSubject(resolveOrCreateSubject(slotDto.getOriginalSubjectCode(), slotDto.getOriginalSubjectName(), timetable.getAcroClass().getDepartment())); 
                
                ts.setDayOfWeek(slotDto.getDayOfWeek());
                ts.setTimeSlot(slotDto.getTimeSlot());
                ts.setRoomNumber(slotDto.getRoomNumber());
                ts.setIsActive(true);
                timetableSlotRepository.save(ts);
            }
        }

        // Mark Timetable active
        List<Timetable> otherTimetables = timetableRepository.findByAcroClassAndAcademicYearAndSemester(
                timetable.getAcroClass(), timetable.getAcademicYear(), timetable.getSemester());
        for (Timetable t : otherTimetables) {
            t.setIsActive(false);
            timetableRepository.save(t);
        }
        timetable.setIsActive(true);
        timetableRepository.save(timetable);

        // Automatic Semester Promotion for Students
        // Find students in the class who are currently enrolled in a previous semester
        Integer newSemNumber = timetable.getSemester().getSemesterNumber();
        List<StudentEnrollment> enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(timetable.getAcroClass().getId());
        
        for (StudentEnrollment enrollment : enrollments) {
            if (enrollment.getSemester().getSemesterNumber() < newSemNumber) {
                enrollment.setIsActive(false);
                enrollment.setEffectiveTo(LocalDate.now());
                studentEnrollmentRepository.save(enrollment);
                
                StudentEnrollment newEnrollment = new StudentEnrollment();
                newEnrollment.setStudent(enrollment.getStudent());
                newEnrollment.setAcroClass(timetable.getAcroClass());
                newEnrollment.setAcademicYear(timetable.getAcademicYear());
                newEnrollment.setSemester(timetable.getSemester());
                newEnrollment.setEffectiveFrom(LocalDate.now());
                newEnrollment.setIsActive(true);
                studentEnrollmentRepository.save(newEnrollment);
                
                // Keep the student record up to date
                Student student = enrollment.getStudent();
                student.setCurrentSemester(String.valueOf(newSemNumber));
                // Assume batch doesn't change
            }
        }
    }


    private String fuzzyMatchFaculty(String extractedName, List<Faculty> faculties) {
        if (extractedName == null || extractedName.isBlank()) return null;

        for (Faculty f : faculties) {
            if (f.getUser() == null) continue;
            String dbName = f.getUser().getFirstName() + " " + f.getUser().getLastName();
            if (com.acronexus.util.NameNormalizer.fuzzyMatch(extractedName, dbName)) {
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
