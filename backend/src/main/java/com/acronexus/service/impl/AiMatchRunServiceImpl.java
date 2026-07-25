package com.acronexus.service.impl;

import com.acronexus.dto.AiMatchRunRequestDto;
import com.acronexus.dto.AiMatchRunResponseDto;
import com.acronexus.entity.AiMatchRun;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.AiMatchRunMapper;
import com.acronexus.repository.AiMatchRunRepository;
import com.acronexus.service.AiMatchRunService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;
import com.acronexus.repository.*;
import com.acronexus.service.AiService;
import com.acronexus.dto.ai.AiMatchRequest;
import com.acronexus.dto.ai.AiMatchResponse;
import com.acronexus.entity.AcademicYear;
import com.acronexus.entity.Semester;

@Service
@RequiredArgsConstructor
public class AiMatchRunServiceImpl implements AiMatchRunService {

    private final AiMatchRunRepository repository;
    private final AiMatchRunMapper mapper;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final AcroClassRepository classRepository;
    private final SubjectRepository subjectRepository;
    private final TimetableRepository timetableRepository;
    private final CoordinatorAssignmentRepository coordinatorRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final FacultyClassAssignmentRepository facultyClassAssignmentRepository;
    private final UserRepository userRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;
    private final SubjectVersionRepository subjectVersionRepository;
    private final LectureMaterialRepository lectureMaterialRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final AiService aiService;

    @Override
    @Transactional
    public AiMatchRunResponseDto create(AiMatchRunRequestDto requestDto) {
        AiMatchRun entity = mapper.toEntity(requestDto);
        return mapper.toDto(repository.save(entity));
    }

    @Override
    public AiMatchRunResponseDto getById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("AiMatchRun not found with id: " + id));
    }

    @Override
    public List<AiMatchRunResponseDto> getAll() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AiMatchRunResponseDto update(UUID id, AiMatchRunRequestDto requestDto) {
        AiMatchRun entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AiMatchRun not found with id: " + id));
        // Update fields based on requestDto
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("AiMatchRun not found with id: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public AiMatchResponse executeMatch() {
        AiMatchRequest request = new AiMatchRequest();
        
        request.setStudents(studentRepository.findAll().stream()
                .map(s -> Map.<String, Object>of("id", s.getId()))
                .collect(Collectors.toList()));
                
        request.setFaculty(facultyRepository.findAll().stream()
                .map(f -> Map.<String, Object>of("id", f.getId()))
                .collect(Collectors.toList()));
                
        request.setClasses(classRepository.findAll().stream()
                .map(c -> Map.<String, Object>of("id", c.getId()))
                .collect(Collectors.toList()));
                
        request.setSubjects(subjectRepository.findAll().stream()
                .map(s -> Map.<String, Object>of("id", s.getId()))
                .collect(Collectors.toList()));
                
        request.setTimetables(timetableRepository.findAll().stream()
                .map(t -> Map.<String, Object>of("id", t.getId()))
                .collect(Collectors.toList()));
                
        request.setCoordinators(coordinatorRepository.findAll().stream()
                .map(c -> Map.<String, Object>of("id", c.getId()))
                .collect(Collectors.toList()));

        AiMatchResponse aiResponse = aiService.matchData(request);
        
        return aiResponse;
    }

    @Override
    @Transactional
    public void applyChanges(AiMatchResponse aiResponse) {
        if (aiResponse == null) {
            throw new IllegalArgumentException("AiMatchResponse cannot be null");
        }
        
        try {
            AcademicYear activeYear = academicYearRepository.findAll().stream().findFirst().orElse(null);
            Semester activeSemester = semesterRepository.findAll().stream().findFirst().orElse(null);

            if (activeYear == null || activeSemester == null) {
                throw new IllegalStateException("Active Academic Year or Semester not found");
            }

            java.util.Set<String> notifiedUsers = new java.util.HashSet<>();

            // 1. Student Mapping & Promotion
            List<Map<String, Object>> studentMappings = aiResponse.getStudentMappings();
            if (studentMappings != null) {
                for (Map<String, Object> mapping : studentMappings) {
                    if (mapping.containsKey("studentId") && mapping.containsKey("classId")) {
                        try {
                            UUID studentId = UUID.fromString(mapping.get("studentId").toString());
                            UUID classId = UUID.fromString(mapping.get("classId").toString());
                            
                            com.acronexus.entity.Student student = studentRepository.findById(studentId).orElse(null);
                            com.acronexus.entity.AcroClass acroClass = classRepository.findById(classId).orElse(null);
                            
                            if (student != null && acroClass != null) {
                                // Update Department if missing
                                com.acronexus.entity.User user = student.getUser();
                                if (user != null && user.getDepartment() == null && acroClass.getDepartment() != null) {
                                    user.setDepartment(acroClass.getDepartment());
                                    userRepository.save(user);
                                }
                                
                                // Conflict Detection & Promotion Logic
                                boolean createNew = true;
                                java.util.Optional<com.acronexus.entity.StudentEnrollment> existingOpt = 
                                        studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(student.getId());
                                if (existingOpt.isPresent()) {
                                    com.acronexus.entity.StudentEnrollment existing = existingOpt.get();
                                    if (existing.getAcroClass().getId().equals(classId) &&
                                        existing.getAcademicYear().getId().equals(activeYear.getId()) &&
                                        existing.getSemester().getId().equals(activeSemester.getId())) {
                                        createNew = false; // Already enrolled in the same class/term
                                    } else {
                                        existing.setIsActive(false); // Demote old enrollment
                                        studentEnrollmentRepository.save(existing);
                                    }
                                }

                                if (createNew) {
                                    com.acronexus.entity.StudentEnrollment enrollment = new com.acronexus.entity.StudentEnrollment();
                                    enrollment.setStudent(student);
                                    enrollment.setAcroClass(acroClass);
                                    enrollment.setAcademicYear(activeYear);
                                    enrollment.setSemester(activeSemester);
                                    enrollment.setEffectiveFrom(java.time.LocalDate.now());
                                    enrollment.setIsActive(true);
                                    studentEnrollmentRepository.save(enrollment);
                                    
                                    sendNotification(user, "Student Mapping", "You have been enrolled in " + acroClass.getName() + " for the new term.", notifiedUsers);
                                }
                            }
                        } catch (Exception ex) {
                            // Ignore parse errors
                        }
                    }
                }
            }
            
            // 2. Faculty Mapping
            List<Map<String, Object>> facultyMappings = aiResponse.getFacultyMappings();
            if (facultyMappings != null) {
                for (Map<String, Object> mapping : facultyMappings) {
                    if (mapping.containsKey("facultyId") && mapping.containsKey("classId")) {
                        try {
                            UUID facultyId = UUID.fromString(mapping.get("facultyId").toString());
                            UUID classId = UUID.fromString(mapping.get("classId").toString());
                            
                            com.acronexus.entity.Faculty faculty = facultyRepository.findById(facultyId).orElse(null);
                            com.acronexus.entity.AcroClass acroClass = classRepository.findById(classId).orElse(null);
                            
                            if (faculty != null && acroClass != null) {
                                // Assign to FacultyClassAssignment
                                com.acronexus.entity.FacultyClassAssignment assignment = new com.acronexus.entity.FacultyClassAssignment();
                                assignment.setFaculty(faculty);
                                assignment.setAcroClass(acroClass);
                                assignment.setAcademicYear(activeYear);
                                assignment.setSemester(activeSemester);
                                assignment.setEffectiveFrom(java.time.LocalDate.now());
                                assignment.setIsActive(true);
                                facultyClassAssignmentRepository.save(assignment);
                                
                                // Create ClassSubject if subjectId is provided
                                if (mapping.containsKey("subjectId")) {
                                    UUID subjectId = UUID.fromString(mapping.get("subjectId").toString());
                                    com.acronexus.entity.Subject subject = subjectRepository.findById(subjectId).orElse(null);
                                    if (subject != null) {
                                        java.util.Optional<com.acronexus.entity.ClassSubject> existingCs = 
                                            classSubjectRepository.findByAcademicYearIdAndSemesterIdAndAcroClassIdAndSubjectIdAndFacultyIdAndIsActiveTrue(
                                                activeYear.getId(), activeSemester.getId(), classId, subjectId, facultyId
                                            );
                                        if (existingCs.isEmpty()) {
                                            com.acronexus.entity.ClassSubject cs = new com.acronexus.entity.ClassSubject();
                                            cs.setFaculty(faculty);
                                            cs.setAcroClass(acroClass);
                                            cs.setSubject(subject);
                                            cs.setAcademicYear(activeYear);
                                            cs.setSemester(activeSemester);
                                            cs.setEffectiveFrom(java.time.LocalDate.now());
                                            cs.setIsActive(true);
                                            classSubjectRepository.save(cs);
                                        }
                                    }
                                }
                                sendNotification(faculty.getUser(), "Faculty Mapping", "You have been assigned to new classes for the term.", notifiedUsers);
                            }
                        } catch (Exception ex) {
                            // Ignore parse errors
                        }
                    }
                }
            }
            
            // 3. Coordinator Mapping
            List<Map<String, Object>> coordinatorMappings = aiResponse.getCoordinatorMappings();
            if (coordinatorMappings != null) {
                for (Map<String, Object> mapping : coordinatorMappings) {
                    if (mapping.containsKey("coordinatorId") && mapping.containsKey("classId")) {
                        try {
                            UUID coordId = UUID.fromString(mapping.get("coordinatorId").toString());
                            UUID classId = UUID.fromString(mapping.get("classId").toString());
                            
                            com.acronexus.entity.User coordinator = userRepository.findById(coordId).orElse(null);
                            com.acronexus.entity.AcroClass acroClass = classRepository.findById(classId).orElse(null);
                            
                            if (coordinator != null && acroClass != null) {
                                // Assign Department to Coordinator if missing
                                if (coordinator.getDepartment() == null && acroClass.getDepartment() != null) {
                                    coordinator.setDepartment(acroClass.getDepartment());
                                    userRepository.save(coordinator);
                                }
                                
                                com.acronexus.entity.CoordinatorAssignment assignment = new com.acronexus.entity.CoordinatorAssignment();
                                assignment.setCoordinator(coordinator);
                                assignment.setClassName(acroClass.getName());
                                assignment.setAcademicYear(activeYear != null ? activeYear.getYear() : null);
                                assignment.setSemester(activeSemester != null ? String.valueOf(activeSemester.getSemesterNumber()) : null);
                                assignment.setBatch(null);
                                assignment.setEffectiveFrom(java.time.LocalDate.now());
                                assignment.setIsActive(true);
                                coordinatorRepository.save(assignment);
                                
                                sendNotification(coordinator, "Coordinator Mapping", "You have been assigned as a coordinator for " + acroClass.getName(), notifiedUsers);
                            }
                        } catch (Exception ex) {
                            // Ignore parse errors
                        }
                    }
                }
            }

            // 4. Scheme Mapping
            List<Map<String, Object>> schemeMappings = aiResponse.getSchemeMappings();
            if (schemeMappings != null) {
                for (Map<String, Object> mapping : schemeMappings) {
                    if (mapping.containsKey("subjectId") && mapping.containsKey("resourceType")) {
                        try {
                            UUID subjectId = UUID.fromString(mapping.get("subjectId").toString());
                            String resourceType = mapping.get("resourceType").toString();
                            
                            com.acronexus.entity.Subject subject = subjectRepository.findById(subjectId).orElse(null);
                            if (subject != null) {
                                List<com.acronexus.entity.SubjectVersion> existingVersions = 
                                    subjectVersionRepository.findBySubjectAndAcademicYearAndSemesterAndResourceType(
                                        subject, activeYear, activeSemester, resourceType
                                    );
                                if (existingVersions.isEmpty()) {
                                    com.acronexus.entity.SubjectVersion sv = new com.acronexus.entity.SubjectVersion();
                                    sv.setSubject(subject);
                                    sv.setAcademicYear(activeYear);
                                    sv.setSemester(activeSemester);
                                    sv.setResourceType(resourceType);
                                    sv.setVersionNumber(1);
                                    sv.setIsActive(true);
                                    subjectVersionRepository.save(sv);
                                }
                            }
                        } catch (Exception ex) {
                            // Ignore parse errors
                        }
                    }
                }
            }
            
            // 5. Syllabus Mapping
            List<Map<String, Object>> syllabusMappings = aiResponse.getSyllabusMappings();
            if (syllabusMappings != null) {
                for (Map<String, Object> mapping : syllabusMappings) {
                    if (mapping.containsKey("classSubjectId") && mapping.containsKey("title")) {
                        try {
                            UUID classSubjectId = UUID.fromString(mapping.get("classSubjectId").toString());
                            String title = mapping.get("title").toString();
                            
                            com.acronexus.entity.ClassSubject cs = classSubjectRepository.findById(classSubjectId).orElse(null);
                            if (cs != null) {
                                com.acronexus.entity.LectureMaterial lm = new com.acronexus.entity.LectureMaterial();
                                lm.setClassSubject(cs);
                                lm.setTitle(title);
                                lm.setUnitNumber(mapping.containsKey("unitNumber") ? Integer.parseInt(mapping.get("unitNumber").toString()) : 1);
                                lm.setUploadedBy(cs.getFaculty().getUser());
                                lm.setIsActive(true);
                                lm.setIsDeleted(false);
                                lectureMaterialRepository.save(lm);
                            }
                        } catch (Exception ex) {
                            // Ignore parse errors
                        }
                    }
                }
            }

            // 6. Timetable Mapping
            List<Map<String, Object>> timetableMappings = aiResponse.getTimetableMappings();
            if (timetableMappings != null) {
                for (Map<String, Object> mapping : timetableMappings) {
                    if (mapping.containsKey("classId")) {
                        try {
                            UUID classId = UUID.fromString(mapping.get("classId").toString());
                            com.acronexus.entity.AcroClass acroClass = classRepository.findById(classId).orElse(null);
                            
                            if (acroClass != null) {
                                List<com.acronexus.entity.Timetable> existingTt = 
                                    timetableRepository.findByAcroClassAndAcademicYearAndSemester(acroClass, activeYear, activeSemester);
                                if (existingTt.isEmpty()) {
                                    com.acronexus.entity.Timetable tt = new com.acronexus.entity.Timetable();
                                    tt.setAcroClass(acroClass);
                                    tt.setAcademicYear(activeYear);
                                    tt.setSemester(activeSemester);
                                    tt.setVersionNumber(1);
                                    tt.setIsActive(true);
                                    timetableRepository.save(tt);
                                }
                            }
                        } catch (Exception ex) {
                            // Ignore parse errors
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to apply AI changes: " + e.getMessage());
        }
    }

    private void sendNotification(com.acronexus.entity.User user, String title, String message, java.util.Set<String> notifiedUsers) {
        if (user != null) {
            String cacheKey = user.getId().toString() + ":" + title;
            if (notifiedUsers.contains(cacheKey)) {
                return;
            }
            notifiedUsers.add(cacheKey);
            
            com.acronexus.entity.UserNotification notification = new com.acronexus.entity.UserNotification();
            notification.setUser(user);
            notification.setModule("AI_MAPPING");
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType("INFO");
            notification.setIsRead(false);
            userNotificationRepository.save(notification);
        }
    }
}
