package com.acronexus.service;

import com.acronexus.dto.ClassSubjectRequestDto;
import com.acronexus.dto.ClassSubjectResponseDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassSubjectService {

    private final ClassSubjectRepository classSubjectRepository;
    private final AcroClassRepository acroClassRepository;
    private final SubjectRepository subjectRepository;
    private final FacultyRepository facultyRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final AcademicSyllabusRepository academicSyllabusRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final FacultyActivityRepository facultyActivityRepository;
    private final StudentAttendanceHistoryRepository studentAttendanceHistoryRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizRepository quizRepository;
    private final LectureMaterialRepository lectureMaterialRepository;
    private final SubjectAnnouncementRepository subjectAnnouncementRepository;
    private final EventAttendanceSessionRepository eventAttendanceSessionRepository;
    private final com.acronexus.repository.EventAttendanceSessionSubjectRepository eventAttendanceSessionSubjectRepository;
    private final EventAttendanceRecordRepository eventAttendanceRecordRepository;
    private final FileStorageRepository fileStorageRepository;
    private final EventRepository eventRepository;

    public List<ClassSubjectResponseDto> getAllWorkspaces() {
        return classSubjectRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ClassSubjectResponseDto> getWorkspacesForFaculty(UUID facultyId) {
        return classSubjectRepository.findByFacultyIdAndIsActiveTrue(facultyId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ClassSubjectResponseDto> getWorkspacesForClass(UUID classId) {
        return classSubjectRepository.findByAcroClassIdAndIsActiveTrue(classId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClassSubjectResponseDto> getWorkspacesForEvent(UUID eventId) {
        log.info("DEBUG_ATTENDANCE: getWorkspacesForEvent called for event ID: {}", eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("Event not found"));
        
        List<ClassSubjectResponseDto> result = new java.util.ArrayList<>();
        List<ClassSubject> allActiveSubjects = classSubjectRepository.findAll().stream()
                .filter(cs -> Boolean.TRUE.equals(cs.getIsActive()))
                .collect(Collectors.toList());

        log.info("DEBUG_ATTENDANCE: Found {} total active subject cards in DB.", allActiveSubjects.size());
        java.util.Set<UUID> addedSubjectIds = new java.util.HashSet<>();

        if (event.getTargetAssignments() != null) {
            log.info("DEBUG_ATTENDANCE: Found {} target assignments for event.", event.getTargetAssignments().size());
            for (com.acronexus.entity.EventTargetAssignment t : event.getTargetAssignments()) {
                
                Integer targetSemNum = null;
                if (t.getSemester() != null && !t.getSemester().isBlank()) {
                    try {
                        targetSemNum = Integer.parseInt(t.getSemester().replaceAll("[^0-9]", ""));
                    } catch (Exception e) {}
                }

                log.info("DEBUG_ATTENDANCE: Assignment details -> IsEntireBatch: {}, AcroClassId: {}, Semester String: {}, Semester Num: {}", 
                         t.getIsEntireBatch(), t.getAcroClass() != null ? t.getAcroClass().getId() : "null", t.getSemester(), targetSemNum);

                if (Boolean.TRUE.equals(t.getIsEntireBatch()) && event.getDepartment() != null) {
                    List<com.acronexus.entity.AcroClass> deptClasses = acroClassRepository.findByDepartmentId(event.getDepartment().getId());
                    for (com.acronexus.entity.AcroClass ac : deptClasses) {
                        UUID finalClassId = ac.getId();
                        String finalClassName = ac.getName();
                        Integer finalSemNum = targetSemNum;
                        
                        allActiveSubjects.stream().filter(cs -> {
                            if (cs.getAcroClass() == null) return false;
                            boolean matchClass = (finalClassId != null && cs.getAcroClass().getId().equals(finalClassId)) ||
                                                 (finalClassName != null && cs.getAcroClass().getName() != null && cs.getAcroClass().getName().trim().equalsIgnoreCase(finalClassName.trim()));
                            boolean matchSem = true;
                            if (finalSemNum != null && cs.getSemester() != null) {
                                matchSem = cs.getSemester().getSemesterNumber().equals(finalSemNum);
                            }
                            return matchClass && matchSem;
                        }).forEach(cs -> {
                            if (addedSubjectIds.add(cs.getId())) {
                                result.add(mapToDto(cs));
                            }
                        });
                    }
                } else if (t.getAcroClass() != null) {
                    UUID finalClassId = t.getAcroClass().getId();
                    String finalClassName = t.getAcroClass().getName();
                    Integer finalSemNum = targetSemNum;

                    allActiveSubjects.stream().filter(cs -> {
                        if (cs.getAcroClass() == null) return false;
                        boolean matchClass = (finalClassId != null && cs.getAcroClass().getId().equals(finalClassId)) ||
                                             (finalClassName != null && cs.getAcroClass().getName() != null && cs.getAcroClass().getName().trim().equalsIgnoreCase(finalClassName.trim()));
                        boolean matchSem = true;
                        if (finalSemNum != null && cs.getSemester() != null) {
                            matchSem = cs.getSemester().getSemesterNumber().equals(finalSemNum);
                        }
                        
                        if (matchClass && matchSem) {
                            log.info("DEBUG_ATTENDANCE: MATCHED subject card {} for class {} ({})", cs.getSubject().getName(), finalClassName, finalClassId);
                        }
                        
                        return matchClass && matchSem;
                    }).forEach(cs -> {
                        if (addedSubjectIds.add(cs.getId())) {
                            result.add(mapToDto(cs));
                        }
                    });
                }
            }
        }

        log.info("DEBUG_ATTENDANCE: Total returned subject cards: {}", result.size());
        return result;
    }

    public ClassSubjectResponseDto createWorkspace(ClassSubjectRequestDto dto) {
        AcroClass acroClass = acroClassRepository.findById(dto.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        Faculty faculty = facultyRepository.findById(dto.getFacultyId())
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
        AcademicYear academicYear = academicYearRepository.findById(dto.getAcademicYearId())
                .orElseThrow(() -> new RuntimeException("Academic Year not found"));
        Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        ClassSubject classSubject = new ClassSubject();
        classSubject.setAcroClass(acroClass);
        classSubject.setSubject(subject);
        classSubject.setFaculty(faculty);
        classSubject.setAcademicYear(academicYear);
        classSubject.setSemester(semester);
        classSubject.setEffectiveFrom(dto.getEffectiveFrom());
        classSubject.setEffectiveTo(dto.getEffectiveTo());
        classSubject.setIsActive(true);

        ClassSubject saved = classSubjectRepository.save(classSubject);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteWorkspace(UUID id) {
        ClassSubject classSubject = classSubjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ClassSubject not found"));
        
        List<UUID> classSubjectIds = List.of(id);
        
        // 1. Find all FileStorage IDs associated with this Subject Card (from assignments, submissions, materials)
        List<UUID> fileIds = new java.util.ArrayList<>();
        fileIds.addAll(assignmentSubmissionRepository.findFileIdsByClassSubjectIds(classSubjectIds));
        fileIds.addAll(assignmentRepository.findFileIdsByClassSubjectIds(classSubjectIds));
        fileIds.addAll(lectureMaterialRepository.findFileIdsByClassSubjectIds(classSubjectIds));
        
        // Load the documentUrls to physically delete them from local disk after DB deletion
        List<String> filePathsToDelete = new java.util.ArrayList<>();
        if (!fileIds.isEmpty()) {
            List<FileStorage> files = fileStorageRepository.findAllById(fileIds);
            for (FileStorage fs : files) {
                if (fs.getDocumentUrl() != null) {
                    filePathsToDelete.add(fs.getDocumentUrl());
                }
            }
        }

        // 2. Delete Assignment Submissions (Child of Assignment)
        assignmentSubmissionRepository.deleteByClassSubjectIds(classSubjectIds);

        // 3. Delete Assignments (Parent)
        assignmentRepository.deleteByClassSubjectIds(classSubjectIds);

        // 4. Delete Quiz Attempts (Child of Quiz)
        quizAttemptRepository.deleteByClassSubjectIds(classSubjectIds);

        // 5. Delete Quiz Questions (Child of Quiz)
        quizQuestionRepository.deleteByClassSubjectIds(classSubjectIds);

        // 6. Delete Quizzes (Parent)
        quizRepository.deleteByClassSubjectIds(classSubjectIds);

        // 7. Delete Lecture Materials
        lectureMaterialRepository.deleteByClassSubjectIds(classSubjectIds);

        // 8. Delete Subject Announcements
        subjectAnnouncementRepository.deleteByClassSubjectIds(classSubjectIds);
        
        // 9. Delete Student Attendance History
        studentAttendanceHistoryRepository.deleteByClassSubjectIds(classSubjectIds);
        
        // 10. Delete Student Attendance records
        studentAttendanceRepository.deleteByClassSubjectIds(classSubjectIds);
        
        // 11. Delete Attendance Sessions
        attendanceSessionRepository.deleteByClassSubjectIds(classSubjectIds);
        
        // 12. Delete Faculty Teaching History
        facultyActivityRepository.deleteByClassSubjectIds(classSubjectIds);

        // 12.5 Delete Event Attendance Records and Sessions tied to this subject
        eventAttendanceSessionSubjectRepository.deleteByClassSubjectIds(classSubjectIds);
        List<com.acronexus.entity.EventAttendanceSession> orphanedSessions = eventAttendanceSessionRepository.findSessionsWithNoSubjects();
        if (orphanedSessions != null && !orphanedSessions.isEmpty()) {
            List<UUID> sessionIds = orphanedSessions.stream().map(com.acronexus.entity.EventAttendanceSession::getId).collect(Collectors.toList());
            eventAttendanceRecordRepository.deleteBySessionIdIn(sessionIds);
            eventAttendanceSessionRepository.deleteAll(orphanedSessions);
        }

        // 13. Hard Delete the ClassSubject itself
        classSubjectRepository.deleteById(id);
        
        // 14. Delete the exclusively owned FileStorage records from the database
        if (!fileIds.isEmpty()) {
            fileStorageRepository.deleteAllById(fileIds);
        }
        
        // 15. Physically delete the files from the local filesystem
        for (String path : filePathsToDelete) {
            try {
                java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(path));
            } catch (java.io.IOException e) {
                log.error("Failed to physically delete file: {}", path, e);
            }
        }
        
        log.info("Transactionally HARD DELETED Subject Card {} and all exclusively associated academic data.", id);
    }

    private ClassSubjectResponseDto mapToDto(ClassSubject classSubject) {
        ClassSubjectResponseDto dto = new ClassSubjectResponseDto();
        dto.setId(classSubject.getId());

        if (classSubject.getAcroClass() != null) {
            dto.setClassId(classSubject.getAcroClass().getId());
            dto.setClassName(classSubject.getAcroClass().getName() + " - " + classSubject.getAcroClass().getSection());
            
            List<CoordinatorAssignment> coordinatorAssignments = coordinatorAssignmentRepository.findByClassNameAndIsActiveTrue(classSubject.getAcroClass().getName());
            if (!coordinatorAssignments.isEmpty()) {
                CoordinatorAssignment ca = coordinatorAssignments.get(0);
                if (ca.getCoordinator() != null) {
                    User coordinator = ca.getCoordinator();
                    dto.setCoordinatorName(coordinator.getFirstName() + " " + coordinator.getLastName());
                }
                if (ca.getBatch() != null) {
                    dto.setBatch(ca.getBatch());
                }
            }
        }

        if (classSubject.getSubject() != null) {
            dto.setSubjectId(classSubject.getSubject().getId());
            dto.setSubjectName(classSubject.getSubject().getName());
            dto.setSubjectCode(classSubject.getSubject().getCode());
        }

        if (classSubject.getFaculty() != null && classSubject.getFaculty().getUser() != null) {
            dto.setFacultyId(classSubject.getFaculty().getId());
            dto.setFacultyName(classSubject.getFaculty().getUser().getFirstName() + " " + classSubject.getFaculty().getUser().getLastName());
        }

        if (classSubject.getAcademicYear() != null) {
            dto.setYear(classSubject.getAcademicYear().getYear());
        }

        if (classSubject.getSemester() != null) {
            dto.setSemester("Semester " + classSubject.getSemester().getSemesterNumber());
        }
        
        if (classSubject.getAcroClass() != null && classSubject.getAcroClass().getDepartment() != null) {
            dto.setDepartment(classSubject.getAcroClass().getDepartment().getName());
        }
        
        dto.setGenerationType("manual");

        if (classSubject.getSyllabusSubject() != null) {
            dto.setLinkedSyllabus(mapSyllabusToMap(classSubject.getSyllabusSubject()));
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public void linkSyllabusToClassSubject(ClassSubject cs) {
        if (cs.getSubject() == null) return;
        String subjectCode = cs.getSubject().getCode();
        String subjectName = cs.getSubject().getName();
        
        String department = null;
        if (cs.getAcroClass() != null && cs.getAcroClass().getDepartment() != null) {
            department = cs.getAcroClass().getDepartment().getName();
        }
        String year = cs.getAcademicYear() != null ? cs.getAcademicYear().getYear() : null;
        String semester = cs.getSemester() != null ? String.valueOf(cs.getSemester().getSemesterNumber()) : null;
        String className = cs.getAcroClass() != null ? cs.getAcroClass().getName() : null;

        // Fetch batch if available from coordinator assignments
        String batch = null;
        if (cs.getAcroClass() != null && cs.getSemester() != null && cs.getAcademicYear() != null) {
            batch = coordinatorAssignmentRepository.findByClassNameAndIsActiveTrue(cs.getAcroClass().getName()).stream()
                    .filter(ca -> java.util.Objects.equals(ca.getSemester(), "Semester " + cs.getSemester().getSemesterNumber()) &&
                                  java.util.Objects.equals(ca.getAcademicYear(), cs.getAcademicYear().getYear()))
                    .map(CoordinatorAssignment::getBatch)
                    .findFirst().orElse(null);
        }

        log.info("Linking syllabus for Subject Card ID: {} -> Code: '{}', Name: '{}', Dept: '{}', Batch: '{}', Year: '{}', Sem: '{}', Class: '{}'",
                cs.getId(), subjectCode, subjectName, department, batch, year, semester, className);

        SyllabusSubject match = matchSyllabusSubject(subjectCode, subjectName, department, batch, year, semester, className);
        if (match != null) {
            cs.setSyllabusSubject(match);
            log.info("Successfully linked SyllabusSubject ID: {} to Subject Card ID: {}", match.getId(), cs.getId());
        } else {
            log.warn("Failed to link any syllabus for Subject Card ID: {} ({})", cs.getId(), subjectCode);
        }
    }

    @Transactional
    public void syncAllClassSubjectsWithSyllabus(AcademicSyllabus syllabus) {
        log.info("Triggering re-synchronization of all active Subject Cards after syllabus update (ID: {})", syllabus.getId());
        List<ClassSubject> activeSubjects = classSubjectRepository.findAll().stream()
                .filter(cs -> Boolean.TRUE.equals(cs.getIsActive()))
                .collect(Collectors.toList());

        for (ClassSubject cs : activeSubjects) {
            if (cs.getSubject() == null) continue;
            String subjectCode = cs.getSubject().getCode();
            String subjectName = cs.getSubject().getName();
            
            String dept = cs.getAcroClass() != null && cs.getAcroClass().getDepartment() != null 
                ? cs.getAcroClass().getDepartment().getName() : null;
            String yr = cs.getAcademicYear() != null ? cs.getAcademicYear().getYear() : null;
            String sem = cs.getSemester() != null ? String.valueOf(cs.getSemester().getSemesterNumber()) : null;
            String cls = cs.getAcroClass() != null ? cs.getAcroClass().getName() : null;

            String batch = null;
            if (cs.getAcroClass() != null && cs.getSemester() != null && cs.getAcademicYear() != null) {
                batch = coordinatorAssignmentRepository.findByClassNameAndIsActiveTrue(cs.getAcroClass().getName()).stream()
                        .filter(ca -> java.util.Objects.equals(ca.getSemester(), "Semester " + cs.getSemester().getSemesterNumber()) &&
                                      java.util.Objects.equals(ca.getAcademicYear(), cs.getAcademicYear().getYear()))
                        .map(CoordinatorAssignment::getBatch)
                        .findFirst().orElse(null);
            }

            SyllabusSubject match = matchSyllabusSubject(subjectCode, subjectName, dept, batch, yr, sem, cls);
            if (match != null && (cs.getSyllabusSubject() == null || !cs.getSyllabusSubject().getId().equals(match.getId()))) {
                cs.setSyllabusSubject(match);
                classSubjectRepository.save(cs);
                log.info("Updated Subject Card ID: {} with matched SyllabusSubject ID: {}", cs.getId(), match.getId());
            }
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onApplicationReady() {
        log.info("ApplicationReadyEvent received: Checking unlinked active Subject Cards for automatic syllabus sync...");
        try {
            List<ClassSubject> unlinked = classSubjectRepository.findAll().stream()
                    .filter(cs -> Boolean.TRUE.equals(cs.getIsActive()) && cs.getSyllabusSubject() == null)
                    .collect(Collectors.toList());
            log.info("Found {} unlinked active Subject Cards.", unlinked.size());
            for (ClassSubject cs : unlinked) {
                linkSyllabusToClassSubject(cs);
                if (cs.getSyllabusSubject() != null) {
                    classSubjectRepository.save(cs);
                }
            }
        } catch (Exception e) {
            log.warn("Could not execute startup syllabus synchronization (schema might be updating or empty): {}", e.getMessage());
        }
    }

    public SyllabusSubject matchSyllabusSubject(String subjectCode, String subjectName, String department, String semester, String className) {
        return matchSyllabusSubject(subjectCode, subjectName, department, null, null, semester, className);
    }

    public SyllabusSubject matchSyllabusSubject(String subjectCode, String subjectName, String department, String batch, String year, String semester, String className) {
        log.info("==================================================");
        log.info("DEBUG: SYLLABUS MATCHING PIPELINE INITIATED");
        log.info("Target Subject Card Metadata -> Code: '{}', Name: '{}', Dept: '{}', Batch: '{}', Year: '{}', Sem: '{}', Class: '{}'",
                subjectCode, subjectName, department, batch, year, semester, className);

        List<AcademicSyllabus> candidateSyllabi = academicSyllabusRepository.findAll().stream()
                .filter(s -> s.getFileStorage() != null && !Boolean.TRUE.equals(s.getFileStorage().getIsDeleted()))
                .sorted(Comparator.comparing(s -> s.getFileStorage().getUploadedAt(), Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        if (candidateSyllabi.isEmpty()) {
            log.warn("DEBUG: Match failed because no uploaded candidate syllabi exist in the database.");
            return null;
        }

        for (AcademicSyllabus syl : candidateSyllabi) {
            log.info("--------------------------------------------------");
            log.info("Evaluating Candidate Syllabus ID: {}, File: {}, Total Subjects: {}",
                    syl.getId(), syl.getFileStorage() != null ? syl.getFileStorage().getFileName() : "N/A", syl.getTotalSubjects());
            log.info("Syllabus Metadata -> Dept: '{}', Batch: '{}', Year: '{}', Sem: '{}', Class: '{}'",
                    syl.getDepartment(), syl.getBatch(), syl.getAcademicYear(), syl.getSemester(), syl.getClassName());

            // 1. Department
            if (department != null && !department.trim().isEmpty() && syl.getDepartment() != null && !syl.getDepartment().trim().isEmpty()) {
                if (!department.trim().equalsIgnoreCase(syl.getDepartment().trim())) {
                    log.info("Why match fails: Step 1 Department mismatch (Target: '{}' != Syllabus: '{}')", department, syl.getDepartment());
                    continue;
                }
            }

            // 2. Batch
            if (batch != null && !batch.trim().isEmpty() && syl.getBatch() != null && !syl.getBatch().trim().isEmpty()) {
                if (!batch.trim().equalsIgnoreCase(syl.getBatch().trim())) {
                    log.info("Why match fails: Step 2 Batch mismatch (Target: '{}' != Syllabus: '{}')", batch, syl.getBatch());
                    continue;
                }
            }

            // 3. Year
            if (year != null && !year.trim().isEmpty() && syl.getAcademicYear() != null && !syl.getAcademicYear().trim().isEmpty()) {
                if (!matchYear(year, syl.getAcademicYear())) {
                    log.info("Why match fails: Step 3 Year mismatch (Target: '{}' != Syllabus: '{}')", year, syl.getAcademicYear());
                    continue;
                }
            }

            // 4. Semester
            if (semester != null && !semester.trim().isEmpty() && syl.getSemester() != null && !syl.getSemester().trim().isEmpty()) {
                String semTarget = semester.replaceAll("[^0-9]", "");
                String semSyllabus = syl.getSemester().replaceAll("[^0-9]", "");
                if (!semTarget.isEmpty() && !semSyllabus.isEmpty() && !semTarget.equals(semSyllabus)) {
                    log.info("Why match fails: Step 4 Semester mismatch (Target: '{}' != Syllabus: '{}')", semester, syl.getSemester());
                    continue;
                }
            }

            // 5. Class
            if (className != null && !className.trim().isEmpty() && syl.getClassName() != null && !syl.getClassName().trim().isEmpty()) {
                if (!className.replaceAll("\\s+", "").equalsIgnoreCase(syl.getClassName().replaceAll("\\s+", ""))) {
                    log.info("Why match fails: Step 5 Class mismatch (Target: '{}' != Syllabus: '{}')", className, syl.getClassName());
                    continue;
                }
            }

            log.info("Metadata comparison SUCCESS for Syllabus ID: {}. Checking extracted subjects list...", syl.getId());

            if (syl.getSubjects() == null || syl.getSubjects().isEmpty()) {
                log.warn("Why match fails: Extracted syllabus data contains no subjects.");
                continue;
            }
            log.info("Extracted syllabus contains {} subjects.", syl.getSubjects().size());

            // 6. Subject Code (Highest Priority)
            if (subjectCode != null && !subjectCode.trim().isEmpty() && !subjectCode.equalsIgnoreCase("TBD") && !subjectCode.equalsIgnoreCase("NULL")) {
                String normTargetCode = subjectCode.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                log.info("Step 6: Attempting Subject Code Match (Highest Priority). Normalized Target Code: '{}'", normTargetCode);
                for (SyllabusSubject ss : syl.getSubjects()) {
                    if (ss.getSubjectCode() != null) {
                        String normCode = ss.getSubjectCode().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                        log.debug("Comparing against Extracted Subject Code: '{}' (normalized: '{}'), Name: '{}'", ss.getSubjectCode(), normCode, ss.getSubjectName());
                        if (!normCode.isEmpty() && normTargetCode.equals(normCode)) {
                            log.info("✅ SUCCESS! Matched by Subject Code: '{}' == '{}' in Syllabus ID: {}", subjectCode, ss.getSubjectCode(), syl.getId());
                            log.info("Final syllabus returned to frontend -> ID: {}, Code: {}, Name: {}", ss.getId(), ss.getSubjectCode(), ss.getSubjectName());
                            return ss;
                        }
                    }
                }
                log.info("Step 6: No exact match by Subject Code in this syllabus record.");
            }

            // 7. Subject Name (Fallback)
            if (subjectName != null && !subjectName.trim().isEmpty()) {
                String normTargetName = subjectName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                log.info("Step 7: Attempting Subject Name Match (Fallback). Normalized Target Name: '{}'", normTargetName);
                for (SyllabusSubject ss : syl.getSubjects()) {
                    if (ss.getSubjectName() != null) {
                        String normName = ss.getSubjectName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                        log.debug("Comparing against Extracted Subject Name: '{}' (normalized: '{}'), Code: '{}'", ss.getSubjectName(), normName, ss.getSubjectCode());
                        if (!normName.isEmpty() && (normTargetName.equals(normName) || normTargetName.contains(normName) || normName.contains(normTargetName))) {
                            log.info("✅ SUCCESS! Matched by Subject Name Fallback: '{}' ~= '{}' in Syllabus ID: {}", subjectName, ss.getSubjectName(), syl.getId());
                            log.info("Final syllabus returned to frontend -> ID: {}, Code: {}, Name: {}", ss.getId(), ss.getSubjectCode(), ss.getSubjectName());
                            return ss;
                        }
                    }
                }
                log.info("Step 7: No match by Subject Name in this syllabus record.");
            }
        }

        log.warn("DEBUG: Complete matching pipeline finished without finding a matching subject syllabus.");
        return null;
    }

    private boolean matchYear(String y1, String y2) {
        if (y1 == null || y2 == null) return true;
        String n1 = y1.trim().toLowerCase();
        String n2 = y2.trim().toLowerCase();
        if (n1.equals(n2)) return true;
        String d1 = extractYearNumber(n1);
        String d2 = extractYearNumber(n2);
        if (d1 != null && d2 != null) {
            return d1.equals(d2);
        }
        return true;
    }

    private String extractYearNumber(String y) {
        if (y.matches(".*\\d{4}.*")) return null; // Ignore calendar years like 2023-2024
        if (y.matches("^1$|.*first.*|.*1st.*|.*year 1.*")) return "1";
        if (y.matches("^2$|.*second.*|.*2nd.*|.*year 2.*")) return "2";
        if (y.matches("^3$|.*third.*|.*3rd.*|.*year 3.*")) return "3";
        if (y.matches("^4$|.*fourth.*|.*4th.*|.*year 4.*")) return "4";
        if (y.matches("^5$|.*fifth.*|.*5th.*|.*year 5.*")) return "5";
        return null;
    }

    @Transactional
    public Map<String, Object> getSubjectSyllabus(UUID classSubjectId) {
        Optional<ClassSubject> optCs = classSubjectRepository.findById(classSubjectId);
        if (optCs.isEmpty()) {
            log.warn("getSubjectSyllabus: Subject Card with ID {} not found.", classSubjectId);
            return null;
        }
        ClassSubject cs = optCs.get();
        if (cs.getSyllabusSubject() == null) {
            log.info("getSubjectSyllabus: Subject Card ID {} currently has no linked syllabus. Attempting real-time linking...", classSubjectId);
            linkSyllabusToClassSubject(cs);
            if (cs.getSyllabusSubject() != null) {
                classSubjectRepository.save(cs);
            }
        }
        if (cs.getSyllabusSubject() == null) {
            return null;
        }
        return mapSyllabusToMap(cs.getSyllabusSubject());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMatchedSyllabusByParams(String subjectCode, String subjectName, String department, String semester, String className) {
        return getMatchedSyllabusByParams(subjectCode, subjectName, department, null, null, semester, className);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMatchedSyllabusByParams(String subjectCode, String subjectName, String department, String batch, String year, String semester, String className) {
        SyllabusSubject matched = matchSyllabusSubject(subjectCode, subjectName, department, batch, year, semester, className);
        if (matched == null) {
            return null;
        }
        return mapSyllabusToMap(matched);
    }

    private Map<String, Object> mapSyllabusToMap(SyllabusSubject ss) {
        Map<String, Object> map = new HashMap<>();
        map.put("subjectCode", ss.getSubjectCode());
        map.put("subjectName", ss.getSubjectName());
        map.put("credits", ss.getCredits());
        map.put("theoryHours", ss.getTheoryHours());
        map.put("practicalHours", ss.getPracticalHours());
        map.put("type", ss.getType());
        map.put("unitTitles", ss.getUnitTitles());
        map.put("rawContent", ss.getRawContent());
        if (ss.getAcademicSyllabus() != null && ss.getAcademicSyllabus().getFileStorage() != null) {
            map.put("fileStorageId", ss.getAcademicSyllabus().getFileStorage().getId());
            map.put("fileName", ss.getAcademicSyllabus().getFileStorage().getFileName());
            map.put("documentUrl", "/api/v1/academic-resources/" + ss.getAcademicSyllabus().getFileStorage().getId() + "/download");
        }
        return map;
    }
}
