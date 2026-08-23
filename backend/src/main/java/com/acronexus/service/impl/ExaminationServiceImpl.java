package com.acronexus.service.impl;

import com.acronexus.dto.ExaminationRequestDto;
import com.acronexus.dto.ExaminationResponseDto;
import com.acronexus.entity.Department;
import com.acronexus.entity.Examination;
import com.acronexus.entity.Semester;
import com.acronexus.exception.DuplicateResourceException;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.ExaminationMapper;
import com.acronexus.repository.DepartmentRepository;
import com.acronexus.repository.ExaminationRepository;
import com.acronexus.repository.SemesterRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.entity.ExaminationEligibilityList;
import com.acronexus.entity.ExaminationEligibilityStudent;
import com.acronexus.entity.Student;
import com.acronexus.entity.AcroClass;
import com.acronexus.entity.AcademicYear;
import com.acronexus.dto.ExaminationEligibilityListDto;
import com.acronexus.dto.ExaminationEligibilityStudentDto;
import com.acronexus.dto.ExaminationEligibilityMetricsDto;
import com.acronexus.repository.ExaminationEligibilityListRepository;
import com.acronexus.repository.ExaminationEligibilityStudentRepository;
import com.acronexus.repository.StudentRepository;
import com.acronexus.repository.StudentEnrollmentRepository;
import com.acronexus.repository.AcroClassRepository;
import com.acronexus.repository.AcademicYearRepository;
import org.springframework.web.multipart.MultipartFile;
import com.acronexus.entity.ExaminationTimetable;
import com.acronexus.dto.ExaminationTimetableDto;
import com.acronexus.repository.ExaminationTimetableRepository;
import java.io.IOException;

import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.ExaminationService;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExaminationServiceImpl implements ExaminationService {
    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.AcroClassRepository acroClassRepository;
    
    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.AcademicYearRepository academicYearRepository;
    
    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.ExaminationTimetableRepository timetableRepository;
    
    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.SeatingArrangementRepository seatingArrangementRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.StudentAttendanceRepository studentAttendanceRepository;
    
    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.AssignmentSubmissionRepository assignmentSubmissionRepository;
    
    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.QuizAttemptRepository quizAttemptRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.AssignmentRepository assignmentRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.acronexus.repository.QuizRepository quizRepository;


    private final ExaminationEligibilityListRepository eligibilityListRepository;
    private final ExaminationEligibilityStudentRepository eligibilityStudentRepository;
    private final StudentRepository studentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;


    private final ExaminationRepository repository;
    private final DepartmentRepository departmentRepository;
    private final SemesterRepository semesterRepository;
    private final ExaminationMapper mapper;
    private final UserRepository userRepository;
    private final com.acronexus.service.NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired
    public ExaminationServiceImpl(
        ExaminationEligibilityListRepository eligibilityListRepository,
        ExaminationEligibilityStudentRepository eligibilityStudentRepository,
        StudentRepository studentRepository,
        StudentEnrollmentRepository studentEnrollmentRepository,
        ExaminationRepository repository,
        DepartmentRepository departmentRepository,
        SemesterRepository semesterRepository,
        ExaminationMapper mapper,
        UserRepository userRepository,
        com.acronexus.service.NotificationService notificationService
    ) {
        this.eligibilityListRepository = eligibilityListRepository;
        this.eligibilityStudentRepository = eligibilityStudentRepository;
        this.studentRepository = studentRepository;
        this.studentEnrollmentRepository = studentEnrollmentRepository;
        this.repository = repository;
        this.departmentRepository = departmentRepository;
        this.semesterRepository = semesterRepository;
        this.mapper = mapper;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }


    private void verifyDepartmentAccess(Department department) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        
        if (currentUser.getRole() == UserRole.HOD || currentUser.getRole() == UserRole.COORDINATOR) {
            if (currentUser.getDepartment() != null && !currentUser.getDepartment().getId().equals(department.getId())) {
                throw new RuntimeException("Access Denied: Examination does not belong to your department");
            }
        } else if (currentUser.getRole() == UserRole.FACULTY) {
            throw new RuntimeException("Access Denied: Faculty cannot manage examinations");
        }
    }
        @Override
    @Transactional
    public ExaminationResponseDto create(ExaminationRequestDto requestDto) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        Department department = currentUser.getDepartment();
        if (department == null) {
            throw new RuntimeException("Department not assigned to current user");
        }

        if (repository.existsByDepartmentIdAndSemesterIdAndTypeAndIsDeletedFalse(
                department.getId(), requestDto.getSemesterId(), requestDto.getType())) {
            throw new DuplicateResourceException("Examination of this type already exists for the given department and semester");
        }
        Semester semester = semesterRepository.findById(requestDto.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));

        verifyDepartmentAccess(department);

        Examination entity = mapper.toEntity(requestDto);
        entity.setDepartment(department);
        entity.setSemester(semester);
        
        entity.setBatch(requestDto.getBatch());
        entity.setCreatedBy(currentUser);
        
        if (requestDto.getAcademicYearId() != null) {
            AcademicYear academicYear = academicYearRepository.findById(requestDto.getAcademicYearId())
                    .orElseThrow(() -> new ResourceNotFoundException("Academic Year not found"));
            entity.setAcademicYear(academicYear);
        }
        
        if (requestDto.getClassIds() != null && !requestDto.getClassIds().isEmpty()) {
            java.util.List<AcroClass> acroClasses = acroClassRepository.findAllById(requestDto.getClassIds());
            entity.setClasses(new java.util.HashSet<>(acroClasses));
        }
        
        Examination saved = repository.save(entity);
        notifyExaminationCreated(saved);
        
        return mapper.toDto(saved);
    }
    @Override
@Transactional(readOnly = true)
    public ExaminationResponseDto getById(UUID id) {
        return repository.findByIdAndIsDeletedFalse(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found with id: " + id));
    }
    @Override
@Transactional(readOnly = true)
    public List<ExaminationResponseDto> getAll() {
        return repository.findAllByIsDeletedFalse().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
        @Override
    @Transactional
    public ExaminationResponseDto update(UUID id, ExaminationRequestDto requestDto) {
        Examination entity = repository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found with id: " + id));

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        Department department = currentUser.getDepartment();

        if (repository.existsByDepartmentIdAndSemesterIdAndTypeAndIsDeletedFalseAndIdNot(department.getId(), requestDto.getSemesterId(), requestDto.getType(), id)) {
            throw new DuplicateResourceException("Another examination of this type already exists for the given department and semester");
        }

        Semester semester = semesterRepository.findById(requestDto.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));

        verifyDepartmentAccess(entity.getDepartment());
        verifyDepartmentAccess(department);

        entity.setName(requestDto.getName());
        entity.setType(requestDto.getType());
        entity.setCustomType(requestDto.getCustomType());
        entity.setStartDate(requestDto.getStartDate());
        entity.setEndDate(requestDto.getEndDate());
        entity.setDescription(requestDto.getDescription());
        entity.setDepartment(department);
        entity.setSemester(semester);
        
        entity.setBatch(requestDto.getBatch());
        
        if (requestDto.getAcademicYearId() != null) {
            AcademicYear academicYear = academicYearRepository.findById(requestDto.getAcademicYearId())
                    .orElseThrow(() -> new ResourceNotFoundException("Academic Year not found"));
            entity.setAcademicYear(academicYear);
        } else {
            entity.setAcademicYear(null);
        }
        
        if (requestDto.getClassIds() != null && !requestDto.getClassIds().isEmpty()) {
            java.util.List<AcroClass> acroClasses = acroClassRepository.findAllById(requestDto.getClassIds());
            entity.setClasses(new java.util.HashSet<>(acroClasses));
        } else {
            entity.setClasses(new java.util.HashSet<>());
        }

        return mapper.toDto(repository.save(entity));
    }
    @Override
@Transactional
    public void delete(UUID id) {
        Examination entity = repository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found with id: " + id));
        verifyDepartmentAccess(entity.getDepartment());
        entity.setIsDeleted(true);
        repository.save(entity);
    }
        @Override
    @Transactional
    public ExaminationResponseDto uploadTimetable(UUID id, org.springframework.web.multipart.MultipartFile file) {
        Examination examination = repository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
        
        try {
            // Ensure uploads directory exists
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads", "timetables");
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }
            
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = uploadDir.resolve(fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            
            ExaminationTimetable timetable = new ExaminationTimetable();
            timetable.setExamination(examination);
            timetable.setFileName(file.getOriginalFilename());
            timetable.setFileType(file.getContentType());
            timetable.setFileSize(file.getSize());
            timetable.setFileUrl(filePath.toString());
            
            // Note: In real app we would set createdBy from SecurityContext
            
            examination.getTimetables().add(timetable);
            repository.save(examination);
            
            return mapper.toDto(examination);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store timetable file", e);
        }
    }

    @Override
    @Transactional
    public void deleteTimetable(UUID examId, UUID timetableId) {
        Examination examination = repository.findByIdAndIsDeletedFalse(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
                
        ExaminationTimetable timetable = examination.getTimetables().stream()
                .filter(t -> t.getId().equals(timetableId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Timetable not found"));
                
        try {
            if (timetable.getFileUrl() != null) {
                java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(timetable.getFileUrl()));
            }
        } catch (java.io.IOException e) {
            // Ignore file deletion errors
        }
        
        examination.getTimetables().remove(timetable);
        repository.save(examination);
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.http.ResponseEntity<byte[]> downloadTimetable(UUID examId, UUID timetableId) {
        Examination examination = repository.findByIdAndIsDeletedFalse(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
                
        ExaminationTimetable timetable = examination.getTimetables().stream()
                .filter(t -> t.getId().equals(timetableId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Timetable not found"));
                
        try {
            if (timetable.getFileUrl() == null) {
                throw new ResourceNotFoundException("File not found on server");
            }
            java.nio.file.Path path = java.nio.file.Paths.get(timetable.getFileUrl());
            byte[] data = java.nio.file.Files.readAllBytes(path);
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.add(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + timetable.getFileName() + "\"");
            headers.add(org.springframework.http.HttpHeaders.CONTENT_TYPE, timetable.getFileType() != null ? timetable.getFileType() : "application/pdf");
            
            return new org.springframework.http.ResponseEntity<>(data, headers, org.springframework.http.HttpStatus.OK);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to read timetable file", e);
        }
    }

                @Override
    public java.util.List<com.acronexus.dto.ExaminationEligibilityStudentDto> generateEligibilityList(java.util.UUID id, com.acronexus.dto.EligibilityGenerationRequestDto request) {
        if (request == null) {
            request = new com.acronexus.dto.EligibilityGenerationRequestDto();
        }
        if (request.getCriteria() == null) {
            request.setCriteria(new com.acronexus.dto.EligibilityGenerationRequestDto.EligibilityCriteria());
        }
        if (request.getSettings() == null) {
            request.setSettings(new com.acronexus.dto.EligibilityGenerationRequestDto.EligibilitySettings());
        }
        
        java.util.List<com.acronexus.dto.ExaminationEligibilityMetricsDto> metrics = getEligibilityMetrics(id);
        java.util.List<com.acronexus.dto.ExaminationEligibilityStudentDto> result = new java.util.ArrayList<>();
        
        for (com.acronexus.dto.ExaminationEligibilityMetricsDto metric : metrics) {
            com.acronexus.dto.ExaminationEligibilityStudentDto s = new com.acronexus.dto.ExaminationEligibilityStudentDto();
            s.setId(java.util.UUID.randomUUID());
            s.setStudentId(metric.getId());
            s.setEnrollmentNumber(metric.getEnrollmentNo());
            s.setName(metric.getName());
            s.setClassName(metric.getClassName());
            
            Double attendance = metric.getOverallAttendance() != null ? metric.getOverallAttendance() : 0.0;
            Double assignment = metric.getAssignment() != null ? metric.getAssignment() : 0.0;
            Double quiz = metric.getQuiz() != null ? metric.getQuiz() : 0.0;
            Double internal = metric.getInternal() != null ? metric.getInternal() : 0.0;
            
            s.setOverallAttendance(attendance);
            s.setAssignmentPercentage(assignment);
            s.setQuizPercentage(quiz);
            s.setInternalPercentage(internal);
            
            boolean isEligible = true;
            java.util.List<String> reasons = new java.util.ArrayList<>();
            
            if (request.getCriteria().isAttendance() && attendance < request.getSettings().getAttendance()) {
                isEligible = false;
                reasons.add("Attendance Shortage");
            }
            if (request.getCriteria().isAssignment() && assignment < request.getSettings().getAssignment()) {
                isEligible = false;
                reasons.add("Low Assignment Submissions");
            }
            if (request.getCriteria().isQuiz() && quiz < request.getSettings().getQuiz()) {
                isEligible = false;
                reasons.add("Low Quiz Performance");
            }
            if (request.getCriteria().isInternalMarks() && internal < request.getSettings().getInternal()) {
                isEligible = false;
                reasons.add("Low Internal Marks");
            }
            
            s.setIsEligible(isEligible);
            s.setReason(String.join(", ", reasons));
            result.add(s);
        }
        return result;
    }

    @Override
    public java.util.List<ExaminationEligibilityMetricsDto> getEligibilityMetrics(UUID examinationId) {
        Examination examination = repository.findByIdAndIsDeletedFalse(examinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
                
        java.util.List<ExaminationEligibilityMetricsDto> metrics = new java.util.ArrayList<>();
        java.util.List<com.acronexus.entity.Student> allStudents = new java.util.ArrayList<>();
        
        for (com.acronexus.entity.AcroClass acroClass : examination.getClasses()) {
            String className = acroClass.getSection() != null ? acroClass.getSection() : acroClass.getName();
            java.util.List<com.acronexus.entity.Student> matchedStudents = studentRepository.findByExaminationClassScope(
                    examination.getBatch(),
                    examination.getSemester() != null ? String.valueOf(examination.getSemester().getSemesterNumber()) : null,
                    className
            );
            for (com.acronexus.entity.Student student : matchedStudents) {
                if (!allStudents.contains(student)) {
                    allStudents.add(student);
                    
                    ExaminationEligibilityMetricsDto dto = new ExaminationEligibilityMetricsDto();
                    dto.setId(student.getId());
                    if (student.getUser() != null) {
                        dto.setName(student.getUser().getFirstName() + " " + 
                            (student.getUser().getLastName() != null ? student.getUser().getLastName() : ""));
                    }
                    dto.setEnrollmentNo(student.getEnrollmentNo());
                    dto.setClassName(className);
                    
                    // 1. Calculate Real Attendance
                    double attendancePercentage = 0.0;
                    try {
                        java.util.UUID acYearId = examination.getAcademicYear() != null ? examination.getAcademicYear().getId() : null;
                        java.util.UUID semId = examination.getSemester() != null ? examination.getSemester().getId() : null;
                        Object result = studentAttendanceRepository.getOverallAttendance(student.getId(), acYearId, semId);
                        if (result != null && result instanceof Object[]) {
                            Object[] row = (Object[]) result;
                            Long totalClasses = (Long) row[2];
                            Long totalPresent = (Long) row[3];
                            if (totalClasses != null && totalClasses > 0) {
                                attendancePercentage = (totalPresent != null ? totalPresent : 0) * 100.0 / totalClasses;
                            }
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    dto.setOverallAttendance(Math.round(attendancePercentage * 100.0) / 100.0);
                    
                    // 2. Calculate Real Assignment
                    double assignmentPercentage = 0.0;
                    try {
                        java.util.List<com.acronexus.entity.Assignment> totalAssignments = assignmentRepository.findAssignmentsForStudent(student.getId());
                        if (totalAssignments != null && !totalAssignments.isEmpty()) {
                            java.util.List<com.acronexus.entity.AssignmentSubmission> submissions = assignmentSubmissionRepository.findByStudentId(student.getId());
                            long submittedCount = submissions.stream().filter(s -> !"PENDING".equals(s.getStatus()) && !"EXPIRED".equals(s.getStatus())).count();
                            assignmentPercentage = (submittedCount * 100.0) / totalAssignments.size();
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    dto.setAssignment(Math.round(assignmentPercentage * 100.0) / 100.0);
                    
                    // 3. Calculate Real Quiz
                    double quizPercentage = 0.0;
                    try {
                        if (student.getUser() != null) {
                            UUID userId = student.getUser().getId();
                            java.util.List<com.acronexus.entity.Quiz> totalQuizzes = quizRepository.findAvailableQuizzesForStudent(userId);
                            if (totalQuizzes != null && !totalQuizzes.isEmpty()) {
                                java.util.List<com.acronexus.entity.QuizAttempt> attempts = quizAttemptRepository.findByStudent_User_Id(userId);
                                long attemptCount = attempts.size();
                                quizPercentage = (attemptCount * 100.0) / totalQuizzes.size();
                            }
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    dto.setQuiz(Math.round(quizPercentage * 100.0) / 100.0);
                    
                    // 4. Internal (Mock for now since Internal marks repo might not exist)
                    dto.setInternal(0.0);
                    
                    metrics.add(dto);
                }
            }
        }
        
        metrics.sort(java.util.Comparator.comparing(ExaminationEligibilityMetricsDto::getClassName, java.util.Comparator.nullsLast(String::compareTo))
            .thenComparing(ExaminationEligibilityMetricsDto::getName, java.util.Comparator.nullsLast(String::compareTo)));
            
        return metrics;
    }

    @Override
    public java.util.List<ExaminationEligibilityListDto> getEligibilityList(UUID id) {
        java.util.List<ExaminationEligibilityList> lists = eligibilityListRepository.findByExaminationIdOrderByCreatedAtDesc(id);
                
        java.util.List<ExaminationEligibilityListDto> result = new java.util.ArrayList<>();
        for(ExaminationEligibilityList list : lists) {
            ExaminationEligibilityListDto dto = new ExaminationEligibilityListDto();
            dto.setId(list.getId());
            dto.setExaminationId(id);
            dto.setCreatedAt(list.getCreatedAt());
            
            List<ExaminationEligibilityStudentDto> students = new java.util.ArrayList<>();
            for (ExaminationEligibilityStudent ees : list.getStudents()) {
                ExaminationEligibilityStudentDto s = new ExaminationEligibilityStudentDto();
                s.setId(ees.getId());
                s.setStudentId(ees.getStudent().getId());
                s.setEnrollmentNumber(ees.getStudent().getEnrollmentNo());
                
                String name = ees.getStudent().getUser().getFirstName();
                if (ees.getStudent().getUser().getLastName() != null) {
                    name += " " + ees.getStudent().getUser().getLastName();
                }
                s.setName(name);
                
                // Fetch class name
                studentEnrollmentRepository.findFirstByStudentIdAndAcademicYearIdAndSemesterIdOrderByIdDesc(
                        ees.getStudent().getId(), list.getExamination().getAcademicYear().getId(), list.getExamination().getSemester().getId())
                        .ifPresent(enrollment -> {
                            if (enrollment.getAcroClass() != null) {
                                s.setClassName(enrollment.getAcroClass().getSection() != null ? enrollment.getAcroClass().getSection() : enrollment.getAcroClass().getName());
                            }
                        });
    
                s.setOverallAttendance(ees.getOverallAttendance());
                s.setAssignmentPercentage(ees.getAssignmentPercentage());
                s.setQuizPercentage(ees.getQuizPercentage());
                s.setInternalPercentage(ees.getInternalPercentage());
                s.setIsEligible(ees.getIsEligible());
                s.setReason(ees.getReason());
                students.add(s);
            }
            dto.setStudents(students);
            result.add(dto);
        }
        return result;
    }
    @Override
    @Transactional
    public java.util.List<ExaminationEligibilityListDto> saveEligibilityList(UUID id, ExaminationEligibilityListDto request) {
        Examination examination = repository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
                
        java.util.List<ExaminationEligibilityList> existingLists = eligibilityListRepository.findByExaminationIdOrderByCreatedAtDesc(id);
        if (!existingLists.isEmpty()) {
            eligibilityListRepository.deleteAll(existingLists);
            eligibilityListRepository.flush();
        }
        
        ExaminationEligibilityList list = new ExaminationEligibilityList();
        list.setExamination(examination);
        list = eligibilityListRepository.save(list);
        
        List<ExaminationEligibilityStudent> students = new java.util.ArrayList<>();
        for (ExaminationEligibilityStudentDto dto : request.getStudents()) {
            Student student = studentRepository.findByEnrollmentNo(dto.getEnrollmentNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + dto.getEnrollmentNumber()));
            ExaminationEligibilityStudent ees = new ExaminationEligibilityStudent();
            ees.setEligibilityList(list);
            ees.setStudent(student);
            ees.setIsEligible(dto.getIsEligible());
            ees.setReason(dto.getReason());
            ees.setOverallAttendance(dto.getOverallAttendance());
            ees.setAssignmentPercentage(dto.getAssignmentPercentage());
            ees.setQuizPercentage(dto.getQuizPercentage());
            ees.setInternalPercentage(dto.getInternalPercentage());
            students.add(ees);
        }
        list.setStudents(students);
        eligibilityListRepository.save(list);
        return getEligibilityList(id);
    }
    @Override
@Transactional
    public void deleteEligibilityList(UUID examId, UUID listId) {
        ExaminationEligibilityList list = eligibilityListRepository.findById(listId)
            .orElseThrow(() -> new ResourceNotFoundException("Eligibility list not found"));
        if (!list.getExamination().getId().equals(examId)) {
            throw new IllegalArgumentException("List does not belong to the given examination");
        }
        eligibilityListRepository.delete(list);
    }
    
    private void notifyExaminationCreated(Examination examination) {
        if (examination.getClasses() == null || examination.getClasses().isEmpty()) {
            return;
        }
        
        java.util.Set<UUID> targetUserIds = new java.util.HashSet<>();
        
        for (AcroClass acroClass : examination.getClasses()) {
            targetUserIds.addAll(studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(acroClass.getId()).stream()
                .filter(e -> e.getStudent() != null && e.getStudent().getUser() != null)
                .map(e -> e.getStudent().getUser().getId())
                .collect(Collectors.toList()));
        }
        
        if (targetUserIds.isEmpty()) return;
        
        String title = "New Examination Scheduled";
        String message = "A new examination (" + examination.getName() + ") has been scheduled.";
        
        notificationService.createBulkSystemNotifications(
            new java.util.ArrayList<>(targetUserIds), 
            title, 
            message, 
            "EXAMINATION", 
            examination.getId().toString()
        );
    }
}
