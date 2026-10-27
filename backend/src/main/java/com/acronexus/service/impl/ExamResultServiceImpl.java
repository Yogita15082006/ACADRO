package com.acronexus.service.impl;

import com.acronexus.dto.ExamResultRequestDto;
import com.acronexus.dto.ExamResultResponseDto;
import com.acronexus.entity.ExamResult;
import com.acronexus.entity.ExamResultsHistory;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.ExamResultMapper;
import com.acronexus.repository.ExamResultRepository;
import com.acronexus.repository.ExamResultsHistoryRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.repository.CoordinatorAssignmentRepository;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.ExamResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.acronexus.entity.Examination;
import com.acronexus.entity.ClassSubject;
import com.acronexus.entity.Student;
import com.acronexus.entity.StudentEnrollment;
import com.acronexus.entity.ExamAiFeedback;


@Service
@RequiredArgsConstructor
@Slf4j
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class ExamResultServiceImpl implements ExamResultService {

    private final ExamResultRepository repository;
    private final ExamResultMapper mapper;
    private final ExamResultsHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final com.acronexus.repository.ExamAiFeedbackRepository aiFeedbackRepository;
    private final com.acronexus.repository.ExaminationAttendanceRepository examinationAttendanceRepository;
    private final com.acronexus.repository.ExaminationRepository examinationRepository;
    private final com.acronexus.repository.StudentEnrollmentRepository studentEnrollmentRepository;
    private final com.acronexus.repository.ClassSubjectRepository classSubjectRepository;
    private final com.acronexus.repository.StudentRepository studentRepository;
    private final com.acronexus.repository.ExaminationEligibilityListRepository eligibilityListRepository;
    private final @org.springframework.context.annotation.Lazy com.acronexus.service.ExaminationService examinationService;


    @Override
    @Transactional
    public java.util.List<ExamResultResponseDto> createBulk(com.acronexus.dto.BulkExamResultRequestDto requestDto) {
        return java.util.Collections.emptyList();
    }

    @Override
    @Transactional
    public ExamResultResponseDto create(ExamResultRequestDto requestDto) {
        ExamResult entity = mapper.toEntity(requestDto);
        return mapper.toDto(repository.save(entity));
    }

    @Override
    public ExamResultResponseDto getById(UUID id) {
        ExamResult result = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ExamResult not found with id: " + id));
        verifyStudentAccess(result);
        return mapper.toDto(result);
    }

    @Override
    public List<ExamResultResponseDto> getAll() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ExamResult> results;
        if (currentUser.getRole() == UserRole.STUDENT) {
            Student student = studentRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
            results = repository.findByStudentIdAndIsPublishedTrue(student.getId());
        } else {
            results = repository.findAll();
        }
        
        return results.stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<ExamResultResponseDto> findByExaminationAndClass(UUID examinationId, String className) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.getReferenceById(userDetails.getId());
        
        List<ExamResult> results;
        if (currentUser.getRole() == com.acronexus.entity.UserRole.STUDENT) {
            Student student = studentRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
            results = repository.findByExaminationIdAndStudentIdAndIsPublishedTrue(examinationId, student.getId());
        } else if (className != null && !className.trim().isEmpty()) {
            results = repository.findByExaminationIdAndClassName(examinationId, className);
        } else {
            results = repository.findByExaminationId(examinationId);
        }
        List<ExamResultResponseDto> dtoList = results.stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
                
        if (currentUser.getRole() == com.acronexus.entity.UserRole.STUDENT) {
            for (ExamResultResponseDto dto : dtoList) {
                if (dto.getExamDate() != null && dto.getClassSubjectId() != null) {
                    aiFeedbackRepository.findByExaminationIdAndExamDateAndClassSubjectIdAndStudentId(
                        dto.getExaminationId(), dto.getExamDate(), dto.getClassSubjectId(), dto.getStudentId()
                    ).ifPresent(fb -> dto.setAiFeedback(fb.getOverallPerformance()));
                } else if (dto.getSubjectId() != null) {
                    aiFeedbackRepository.findByExaminationIdAndStudentIdAndSubjectId(
                        dto.getExaminationId(), dto.getStudentId(), dto.getSubjectId()
                    ).ifPresent(fb -> dto.setAiFeedback(fb.getOverallPerformance()));
                }
            }
        }
        return dtoList;
    }

    private void verifyStudentAccess(ExamResult result) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        if (currentUser.getRole() == UserRole.STUDENT) {
            Student student = studentRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
            if (!result.getStudent().getId().equals(student.getId())) {
                throw new RuntimeException("Access Denied: You can only view your own exam results");
            }
        }
    }

    @Override
    @Transactional
    public ExamResultResponseDto update(UUID id, ExamResultRequestDto requestDto) {
        ExamResult entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ExamResult not found with id: " + id));

        BigDecimal oldMarks = entity.getMarksObtained();
        BigDecimal newMarks = requestDto.getMarksObtained();

        if (oldMarks != null && newMarks != null && oldMarks.compareTo(newMarks) != 0) {
            ExamResultsHistory history = new ExamResultsHistory();
            history.setResult(entity);
            history.setPreviousMarksObtained(oldMarks);
            history.setNewMarksObtained(newMarks);
            history.setModificationReason(requestDto.getModificationReason());

            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User currentUser = userRepository.getReferenceById(userDetails.getId());
            history.setModifiedBy(currentUser);

            historyRepository.save(history);
        }

        entity.setMarksObtained(requestDto.getMarksObtained());
        entity.setMaxMarks(requestDto.getMaxMarks());
        entity.setGrade(requestDto.getGrade());
        entity.setRemarks(requestDto.getRemarks());

        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("ExamResult not found with id: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteResultsForClass(UUID examinationId, String className) {
        List<ExamResult> results;
        List<com.acronexus.entity.ExamAiFeedback> feedbacks;
        
        if (className != null && !className.isBlank()) {
            results = repository.findByExaminationIdAndClassName(examinationId, className);
            feedbacks = aiFeedbackRepository.findByExaminationIdAndClassName(examinationId, className);
        } else {
            results = repository.findByExaminationId(examinationId);
            feedbacks = aiFeedbackRepository.findByExaminationId(examinationId);
        }
        
        aiFeedbackRepository.deleteAll(feedbacks);
        repository.deleteAll(results);
    }

    @Override
    @Transactional
    public int publishResults(UUID examinationId, String className, UUID studentId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));

        List<ExamResult> results;
        if (studentId != null) {
            results = repository.findByExaminationIdAndStudentId(examinationId, studentId);
        } else if (className != null && !className.trim().isEmpty()) {
            results = repository.findByExaminationIdAndClassName(examinationId, className);
        } else {
            results = repository.findByExaminationId(examinationId);
        }
        

        int count = 0;
        for (ExamResult result : results) {
            if (result.getIsPublished() == null || !result.getIsPublished()) {
                result.setIsPublished(true);
                count++;
            }
        }
        
        if (count > 0) {
            repository.saveAll(results);
        }
        
        return count;
    }

    @Override
    public List<com.acronexus.dto.PresentStudentDto> getPresentStudents(UUID examinationId, UUID classId) {
        com.acronexus.entity.Examination examination = examinationRepository.findById(examinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
                
        boolean validTarget = examination.getClasses().stream().anyMatch(c -> c.getId().equals(classId));
        if (!validTarget) {
            throw new IllegalArgumentException("Class ID " + classId + " is not a target for this examination");
        }
        
        List<com.acronexus.entity.ExaminationAttendance> attendances = 
            examinationAttendanceRepository.findPresentStudentsByExamAndClassOrdered(examinationId, classId);
            
        return attendances.stream().map(a -> {
            com.acronexus.entity.Student s = a.getStudent();
            com.acronexus.entity.StudentEnrollment enr = studentEnrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(s.getId()).orElse(null);
            
            String sectionDisplay = "";
            if (enr != null && enr.getAcroClass() != null) {
                com.acronexus.entity.AcroClass ac = enr.getAcroClass();
                sectionDisplay = (ac.getSection() != null && !ac.getSection().isEmpty()) ? ac.getSection() : ac.getName();
            }
            
            return new com.acronexus.dto.PresentStudentDto(
                s.getEnrollmentNo(), 
                s.getUser().getFirstName() + " " + (s.getUser().getLastName() != null ? s.getUser().getLastName() : ""), 
                sectionDisplay
            );
        }).collect(Collectors.toList());
    }

    @Override
    public byte[] exportPresentStudentsExcel(UUID examinationId, UUID classId) {
        List<com.acronexus.dto.PresentStudentDto> students = getPresentStudents(examinationId, classId);
        
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
             
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Present Students");
            
            // Header
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("S.No.");
            headerRow.createCell(1).setCellValue("Enrollment No");
            headerRow.createCell(2).setCellValue("Student Name");
            headerRow.createCell(3).setCellValue("Section");
            headerRow.createCell(4).setCellValue("Marks");
            
            // Data
            int rowIdx = 1;
            for (com.acronexus.dto.PresentStudentDto s : students) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(s.getEnrollmentNo());
                row.createCell(2).setCellValue(s.getStudentName());
                row.createCell(3).setCellValue(s.getSection());
                row.createCell(4).setCellValue(""); // Empty Marks
            }
            
            workbook.write(out);
            return out.toByteArray();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to generate Excel file", e);
        }
    }

    @Override
    public List<ExamResultResponseDto> findByExaminationAndContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, String className) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.getReferenceById(userDetails.getId());

        List<ExamResult> results;
        if (currentUser.getRole() == com.acronexus.entity.UserRole.STUDENT) {
            com.acronexus.entity.Student student = studentRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
            results = repository.findByExaminationIdAndExamDateAndClassSubjectIdAndStudentIdAndIsPublishedTrue(examinationId, examDate, classSubjectId, student.getId());
        } else {
            results = repository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
            if (className != null && !className.trim().isEmpty()) {
                results = results.stream().filter(r -> className.equals(r.getClassName())).collect(Collectors.toList());
            }
        }
        List<ExamResultResponseDto> dtoList = results.stream().map(mapper::toDto).collect(Collectors.toList());
        
        if (currentUser.getRole() == com.acronexus.entity.UserRole.STUDENT) {
            for (ExamResultResponseDto dto : dtoList) {
                if (dto.getExamDate() != null && dto.getClassSubjectId() != null) {
                    aiFeedbackRepository.findByExaminationIdAndExamDateAndClassSubjectIdAndStudentId(
                        dto.getExaminationId(), dto.getExamDate(), dto.getClassSubjectId(), dto.getStudentId()
                    ).ifPresent(fb -> dto.setAiFeedback(fb.getOverallPerformance()));
                } else if (dto.getSubjectId() != null) {
                    aiFeedbackRepository.findByExaminationIdAndStudentIdAndSubjectId(
                        dto.getExaminationId(), dto.getStudentId(), dto.getSubjectId()
                    ).ifPresent(fb -> dto.setAiFeedback(fb.getOverallPerformance()));
                }
            }
        }
        return dtoList;
    }

    @Override
    @Transactional
    public void deleteResultsForContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId) {
        List<ExamResult> results = repository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
        List<ExamAiFeedback> feedbacks = aiFeedbackRepository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
        aiFeedbackRepository.deleteAll(feedbacks);
        repository.deleteAll(results);
    }

    @Override
    @Transactional
    public int publishResultsForContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, UUID studentId) {
        log.info("TRACE_PUBLISH: examinationId={}, examDate={}, classSubjectId={}, studentId={}", examinationId, examDate, classSubjectId, studentId);
        if (examinationId == null || examDate == null || classSubjectId == null) {
            throw new IllegalArgumentException("Context parameters examinationId, examDate, and classSubjectId are mandatory.");
        }
        
        List<ExamResult> results;
        if (studentId != null) {
            results = repository.findByExaminationIdAndExamDateAndClassSubjectIdAndStudentId(examinationId, examDate, classSubjectId, studentId)
                .map(java.util.Collections::singletonList).orElse(java.util.Collections.emptyList());
            log.info("TRACE_PUBLISH: Single student query results size: {}", results.size());
        } else {
            results = repository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
            log.info("TRACE_PUBLISH: Context query results size: {}", results.size());
        }
        
        int count = 0;
        for (ExamResult result : results) {
            if (result.getIsPublished() == null || !result.getIsPublished()) {
                result.setIsPublished(true);
                count++;
            }
        }
        
        // Ensure they are actually saved
        if (count > 0) {
            repository.saveAll(results);
        }
        
        return count;
    }

    @Override
    public List<com.acronexus.dto.PresentStudentDto> getPresentStudentsByContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId) {
        List<com.acronexus.entity.ExaminationAttendance> attendances = 
            examinationAttendanceRepository.findPresentStudentsByContextOrdered(examinationId, examDate, classSubjectId);
            
        return attendances.stream().map(a -> {
            com.acronexus.entity.Student s = a.getStudent();
            com.acronexus.entity.StudentEnrollment enr = studentEnrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(s.getId()).orElse(null);
            
            com.acronexus.dto.PresentStudentDto dto = new com.acronexus.dto.PresentStudentDto();
            dto.setStudentName(s.getUser().getFirstName() + " " + (s.getUser().getLastName() != null ? s.getUser().getLastName() : ""));
            dto.setEnrollmentNo(s.getEnrollmentNo());
            if (enr != null && enr.getAcroClass() != null) {
                dto.setSection(enr.getAcroClass().getFunctionalClassName());
            } else {
                dto.setSection("N/A");
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public byte[] exportPresentStudentsExcelByContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId) {
        List<com.acronexus.dto.PresentStudentDto> students = getPresentStudentsByContext(examinationId, examDate, classSubjectId);
        
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
             
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Present Students");
            
            // Header
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("S.No.");
            headerRow.createCell(1).setCellValue("Enrollment No");
            headerRow.createCell(2).setCellValue("Student Name");
            headerRow.createCell(3).setCellValue("Section");
            headerRow.createCell(4).setCellValue("Marks");
            
            // Data
            int rowIdx = 1;
            for (com.acronexus.dto.PresentStudentDto s : students) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(s.getEnrollmentNo());
                row.createCell(2).setCellValue(s.getStudentName());
                row.createCell(3).setCellValue(s.getSection());
                row.createCell(4).setCellValue(""); // Empty column for marks
            }
            
            workbook.write(out);
            return out.toByteArray();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to generate Excel file", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<com.acronexus.dto.ExamResultContextRowDto> getResultContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId) {
        log.info("TRACE [getResultContext]: Fetching context for examinationId={}, examDate={}, classSubjectId={}", examinationId, examDate, classSubjectId);
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassSubject not found"));
        
        List<com.acronexus.entity.StudentEnrollment> enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classSubject.getAcroClass().getId());
        
        List<com.acronexus.entity.ExaminationAttendance> attendances = 
            examinationAttendanceRepository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
        java.util.Map<UUID, com.acronexus.entity.ExaminationAttendance> attendanceMap = attendances.stream()
            .filter(a -> a.getStudent() != null)
            .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a, (e1, e2) -> e1));
            
        List<ExamResult> savedResults = repository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
        log.info("TRACE [getResultContext]: Found {} saved ExamResult records", savedResults.size());
        
        java.util.Map<UUID, ExamResult> resultMap = savedResults.stream()
            .filter(r -> r.getStudent() != null)
            .collect(Collectors.toMap(r -> r.getStudent().getId(), r -> r, (e1, e2) -> e1));

        java.util.Map<UUID, StudentEligibilityData> elgMap = getStudentEligibilityMap(examinationId);
        
        return enrollments.stream().map(enr -> {
            com.acronexus.entity.Student s = enr.getStudent();
            String sectionDisplay = (enr.getAcroClass() != null) ? 
                (enr.getAcroClass().getSection() != null && !enr.getAcroClass().getSection().isEmpty() ? enr.getAcroClass().getSection() : enr.getAcroClass().getName()) : "";
                
            StudentEligibilityData elg = elgMap.get(s.getId());
            boolean isEligible = elg == null || elg.isEligible;
            String elgReason = elg != null ? elg.reason : "";
            Double attendancePct = elg != null ? elg.overallAttendance : null;

            com.acronexus.entity.ExaminationAttendance att = attendanceMap.get(s.getId());
            boolean isPresent = att != null && Boolean.TRUE.equals(att.getIsPresent());
            boolean isMarkedAbsent = att != null && Boolean.FALSE.equals(att.getIsPresent());

            ExamResult res = resultMap.get(s.getId());
            boolean hasResult = res != null && res.getMarksObtained() != null;

            String category;
            String appearanceStatus;
            String appearanceDetail;

            if (isPresent) {
                appearanceStatus = "PRESENT";
                appearanceDetail = "Confirmed Present";
            } else if (isMarkedAbsent) {
                appearanceStatus = "ABSENT";
                appearanceDetail = "Marked Absent in Attendance";
            } else {
                appearanceStatus = "NO_RECORD";
                appearanceDetail = "No Exam Attendance Record";
            }

            if (!isEligible) {
                category = "NOT_ELIGIBLE";
            } else if (isPresent || hasResult) {
                category = "APPEARED";
            } else {
                category = "ELIGIBLE_NOT_APPEARED";
            }

            String status;
            if ("NOT_ELIGIBLE".equals(category)) {
                status = "Not Eligible";
            } else if ("ELIGIBLE_NOT_APPEARED".equals(category)) {
                status = isMarkedAbsent ? "ABSENT" : "Not Appeared";
            } else if (res != null) {
                status = Boolean.TRUE.equals(res.getIsPublished()) ? "Published" : "Saved";
            } else {
                status = "Pending";
            }
            
            if (res != null) {
                log.info("TRACE [getResultContext]: Student {} HAS overlay! marks={}, status={}", s.getId(), res.getMarksObtained(), status);
            }
            
            return com.acronexus.dto.ExamResultContextRowDto.builder()
                .studentId(s.getId())
                .resultId(res != null ? res.getId() : null)
                .enrollmentNo(s.getEnrollmentNo())
                .studentName(s.getUser().getFirstName() + " " + (s.getUser().getLastName() != null ? s.getUser().getLastName() : ""))
                .section(sectionDisplay)
                .marksObtained(res != null ? res.getMarksObtained() : null)
                .maxMarks(res != null ? res.getMaxMarks() : null)
                .grade(res != null ? res.getGrade() : null)
                .remarks(res != null ? res.getRemarks() : null)
                .attendanceStatus(appearanceStatus)
                .appearanceDetail(appearanceDetail)
                .isPublished(res != null ? res.getIsPublished() : false)
                .resultStatus(status)
                .isEligible(isEligible)
                .eligibilityReason(elgReason)
                .category(category)
                .attendancePercentage(attendancePct)
                .build();
        })
        .sorted((a, b) -> {
            String nameA = a.getStudentName() != null ? a.getStudentName() : "";
            String nameB = b.getStudentName() != null ? b.getStudentName() : "";
            return nameA.compareToIgnoreCase(nameB);
        })
        .collect(Collectors.toList());
    }

    @Override
    public byte[] exportResultContextExcel(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId) {
        // Simple stub for now to satisfy interface
        return new byte[0];
    }

    @Override
    @Transactional
    public int bulkSaveResults(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, java.util.List<com.acronexus.dto.ExamResultContextRowDto> results) {
        log.info("TRACE [bulkSaveResults]: examinationId={}, examDate={}, classSubjectId={}, payloadSize={}", examinationId, examDate, classSubjectId, results.size());

        Examination examination = examinationRepository.findById(examinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassSubject not found"));
                
        List<ExamResult> existingResults = repository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
        java.util.Map<UUID, ExamResult> existingMap = existingResults.stream()
                .collect(Collectors.toMap(r -> r.getStudent().getId(), r -> r));
                
        int count = 0;
        for (com.acronexus.dto.ExamResultContextRowDto dto : results) {
            if (dto.getMarksObtained() == null) continue; // Skip empty rows
            
            ExamResult er = existingMap.get(dto.getStudentId());
            if (er == null) {
                er = new ExamResult();
                er.setExamination(examination);
                er.setExamDate(examDate);
                er.setClassSubject(classSubject);
                er.setSubject(classSubject.getSubject());
                Student student = studentRepository.findById(dto.getStudentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
                er.setStudent(student);
                er.setClassName(dto.getSection());
                log.info("TRACE [bulkSaveResults]: Creating NEW ExamResult for studentId={}, marksObtained={}", dto.getStudentId(), dto.getMarksObtained());
            } else {
                log.info("TRACE [bulkSaveResults]: Updating EXISTING ExamResult for studentId={}, oldMarks={}, newMarks={}", dto.getStudentId(), er.getMarksObtained(), dto.getMarksObtained());
            }
            er.setMarksObtained(dto.getMarksObtained());
            er.setMaxMarks(dto.getMaxMarks());
            er.setGrade(dto.getGrade());
            er.setRemarks(dto.getRemarks());
            // DO NOT OVERWRITE isPublished IF IT'S ALREADY TRUE! DO NOT AUTO-PUBLISH!
            if (er.getIsPublished() == null) {
                er.setIsPublished(false);
            }
            repository.save(er);
            
            if (dto.getAiFeedback() != null) {
                com.acronexus.dto.ExamAiFeedbackResponseDto aiDto = dto.getAiFeedback();
                com.acronexus.entity.ExamAiFeedback feedback = aiFeedbackRepository.findByExaminationIdAndExamDateAndClassSubjectIdAndStudentId(examinationId, examDate, classSubjectId, dto.getStudentId())
                        .orElse(new com.acronexus.entity.ExamAiFeedback());
                        
                feedback.setExamination(examination);
                feedback.setStudent(er.getStudent());
                feedback.setSubject(er.getSubject());
                feedback.setClassSubject(classSubject);
                feedback.setExamDate(examDate);
                feedback.setOverallPerformance(aiDto.getOverallPerformance());
                feedback.setStrengths(aiDto.getStrengths());
                feedback.setAreasOfImprovement(aiDto.getAreasOfImprovement());
                feedback.setActionPlan(aiDto.getActionPlan());
                
                aiFeedbackRepository.save(feedback);
            }
            
            count++;
        }
        return count;
    }

    @Override
    public java.util.List<com.acronexus.dto.SavedResultContextDto> getSavedContexts(UUID examinationId) {
        java.util.List<com.acronexus.dto.SavedResultContextDto> dtos = repository.findSavedContextsByExaminationId(examinationId);
        // We also need totalStudents. For each ClassSubject, count students enrolled in the class.
        for (com.acronexus.dto.SavedResultContextDto dto : dtos) {
            ClassSubject cs = classSubjectRepository.findById(dto.getClassSubjectId()).orElse(null);
            if (cs != null && cs.getAcroClass() != null) {
                long totalEnrolled = studentEnrollmentRepository.countByAcroClassIdAndIsActiveTrue(cs.getAcroClass().getId());
                dto.setTotalStudents((int) totalEnrolled);
            }
        }
        return dtos;
    }

    private static class StudentEligibilityData {
        boolean isEligible;
        String reason;
        Double overallAttendance;
        StudentEligibilityData(boolean isEligible, String reason, Double overallAttendance) {
            this.isEligible = isEligible;
            this.reason = reason;
            this.overallAttendance = overallAttendance;
        }
    }

    private java.util.Map<UUID, StudentEligibilityData> getStudentEligibilityMap(UUID examinationId) {
        java.util.Map<UUID, StudentEligibilityData> map = new java.util.HashMap<>();
        try {
            java.util.List<com.acronexus.entity.ExaminationEligibilityList> lists = 
                eligibilityListRepository.findByExaminationIdOrderByCreatedAtDesc(examinationId);
            if (lists != null && !lists.isEmpty() && lists.get(0).getStudents() != null && !lists.get(0).getStudents().isEmpty()) {
                for (com.acronexus.entity.ExaminationEligibilityStudent ees : lists.get(0).getStudents()) {
                    if (ees.getStudent() != null) {
                        map.put(ees.getStudent().getId(), new StudentEligibilityData(
                            Boolean.TRUE.equals(ees.getIsEligible()),
                            ees.getReason() != null ? ees.getReason() : "",
                            ees.getOverallAttendance()
                        ));
                    }
                }
            } else {
                java.util.List<com.acronexus.dto.ExaminationEligibilityStudentDto> generated = 
                    examinationService.generateEligibilityList(examinationId, null);
                if (generated != null) {
                    for (com.acronexus.dto.ExaminationEligibilityStudentDto s : generated) {
                        if (s.getStudentId() != null) {
                            map.put(s.getStudentId(), new StudentEligibilityData(
                                Boolean.TRUE.equals(s.getIsEligible()),
                                s.getReason() != null ? s.getReason() : "",
                                s.getOverallAttendance()
                            ));
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch or generate eligibility list for exam {}: {}", examinationId, e.getMessage());
        }
        return map;
    }

    @Override
    public com.acronexus.dto.ExamStudentCategorySummaryDto getStudentCategorySummary(
            UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, UUID classId) {
        Examination examination = examinationRepository.findById(examinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));

        java.util.Map<UUID, StudentEnrollment> uniqueEnrollments = new java.util.LinkedHashMap<>();
        if (classSubjectId != null) {
            ClassSubject cs = classSubjectRepository.findById(classSubjectId)
                    .orElseThrow(() -> new ResourceNotFoundException("ClassSubject not found"));
            List<StudentEnrollment> list = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(cs.getAcroClass().getId());
            for (StudentEnrollment enr : list) {
                if (enr.getStudent() != null) uniqueEnrollments.putIfAbsent(enr.getStudent().getId(), enr);
            }
        } else if (classId != null) {
            List<StudentEnrollment> list = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classId);
            for (StudentEnrollment enr : list) {
                if (enr.getStudent() != null) uniqueEnrollments.putIfAbsent(enr.getStudent().getId(), enr);
            }
        } else {
            for (com.acronexus.entity.AcroClass ac : examination.getClasses()) {
                List<StudentEnrollment> list = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(ac.getId());
                for (StudentEnrollment enr : list) {
                    if (enr.getStudent() != null) uniqueEnrollments.putIfAbsent(enr.getStudent().getId(), enr);
                }
            }
        }

        // Attendance records
        List<com.acronexus.entity.ExaminationAttendance> attendances;
        if (classSubjectId != null && examDate != null) {
            attendances = examinationAttendanceRepository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
        } else {
            attendances = examinationAttendanceRepository.findByExaminationId(examinationId);
            if (examDate != null) {
                attendances = attendances.stream().filter(a -> examDate.equals(a.getExamDate())).collect(Collectors.toList());
            }
            if (classSubjectId != null) {
                attendances = attendances.stream().filter(a -> a.getClassSubject() != null && classSubjectId.equals(a.getClassSubject().getId())).collect(Collectors.toList());
            }
        }
        java.util.Map<UUID, com.acronexus.entity.ExaminationAttendance> attendanceMap = attendances.stream()
                .filter(a -> a.getStudent() != null)
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a, (e1, e2) -> e1));

        // Result records
        List<ExamResult> results;
        if (classSubjectId != null && examDate != null) {
            results = repository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
        } else {
            results = repository.findByExaminationId(examinationId);
            if (examDate != null) {
                results = results.stream().filter(r -> examDate.equals(r.getExamDate())).collect(Collectors.toList());
            }
            if (classSubjectId != null) {
                results = results.stream().filter(r -> r.getClassSubject() != null && classSubjectId.equals(r.getClassSubject().getId())).collect(Collectors.toList());
            }
        }
        java.util.Map<UUID, ExamResult> resultMap = results.stream()
                .filter(r -> r.getStudent() != null)
                .collect(Collectors.toMap(r -> r.getStudent().getId(), r -> r, (e1, e2) -> e1));

        // Eligibility map
        java.util.Map<UUID, StudentEligibilityData> elgMap = getStudentEligibilityMap(examinationId);

        List<com.acronexus.dto.PresentStudentDto> allStudents = new java.util.ArrayList<>();
        List<com.acronexus.dto.PresentStudentDto> appearedStudents = new java.util.ArrayList<>();
        List<com.acronexus.dto.PresentStudentDto> eligibleNotAppearedStudents = new java.util.ArrayList<>();
        List<com.acronexus.dto.PresentStudentDto> notEligibleStudents = new java.util.ArrayList<>();

        for (StudentEnrollment enr : uniqueEnrollments.values()) {
            Student s = enr.getStudent();
            String sectionDisplay = (enr.getAcroClass() != null) ? 
                (enr.getAcroClass().getSection() != null && !enr.getAcroClass().getSection().isEmpty() ? enr.getAcroClass().getSection() : enr.getAcroClass().getName()) : "";

            StudentEligibilityData elg = elgMap.get(s.getId());
            boolean isEligible = elg == null || elg.isEligible;
            String elgReason = elg != null ? elg.reason : "";
            Double attendancePct = elg != null ? elg.overallAttendance : null;

            com.acronexus.entity.ExaminationAttendance att = attendanceMap.get(s.getId());
            boolean isPresent = att != null && Boolean.TRUE.equals(att.getIsPresent());
            boolean isMarkedAbsent = att != null && Boolean.FALSE.equals(att.getIsPresent());

            ExamResult res = resultMap.get(s.getId());
            boolean hasResult = res != null && res.getMarksObtained() != null;

            String category;
            String appearanceStatus;
            String appearanceDetail;

            if (isPresent) {
                appearanceStatus = "PRESENT";
                appearanceDetail = "Confirmed Present";
            } else if (isMarkedAbsent) {
                appearanceStatus = "ABSENT";
                appearanceDetail = "Marked Absent in Attendance";
            } else {
                appearanceStatus = "NO_RECORD";
                appearanceDetail = "No Exam Attendance Record";
            }

            if (!isEligible) {
                category = "NOT_ELIGIBLE";
            } else if (isPresent || hasResult) {
                category = "APPEARED";
            } else {
                category = "ELIGIBLE_NOT_APPEARED";
            }

            com.acronexus.dto.PresentStudentDto dto = com.acronexus.dto.PresentStudentDto.builder()
                .studentId(s.getId())
                .enrollmentNo(s.getEnrollmentNo())
                .studentName(s.getUser() != null ? (s.getUser().getFirstName() + " " + (s.getUser().getLastName() != null ? s.getUser().getLastName() : "")).trim() : "Unknown")
                .section(sectionDisplay)
                .category(category)
                .isEligible(isEligible)
                .eligibilityReason(elgReason)
                .appearanceStatus(appearanceStatus)
                .appearanceDetail(appearanceDetail)
                .attendancePercentage(attendancePct)
                .marksObtained(res != null ? res.getMarksObtained() : null)
                .grade(res != null ? res.getGrade() : null)
                .isPublished(res != null ? res.getIsPublished() : false)
                .build();

            allStudents.add(dto);
            if ("NOT_ELIGIBLE".equals(category)) {
                notEligibleStudents.add(dto);
            } else if ("APPEARED".equals(category)) {
                appearedStudents.add(dto);
            } else {
                eligibleNotAppearedStudents.add(dto);
            }
        }

        java.util.Comparator<com.acronexus.dto.PresentStudentDto> comparator = 
            java.util.Comparator.comparing(com.acronexus.dto.PresentStudentDto::getSection, java.util.Comparator.nullsLast(String::compareTo))
                .thenComparing(com.acronexus.dto.PresentStudentDto::getStudentName, java.util.Comparator.nullsLast(String::compareTo));
        allStudents.sort(comparator);
        appearedStudents.sort(comparator);
        eligibleNotAppearedStudents.sort(comparator);
        notEligibleStudents.sort(comparator);

        return com.acronexus.dto.ExamStudentCategorySummaryDto.builder()
            .totalStudents(allStudents.size())
            .appearedCount(appearedStudents.size())
            .eligibleNotAppearedCount(eligibleNotAppearedStudents.size())
            .notEligibleCount(notEligibleStudents.size())
            .allStudents(allStudents)
            .appearedStudents(appearedStudents)
            .eligibleNotAppearedStudents(eligibleNotAppearedStudents)
            .notEligibleStudents(notEligibleStudents)
            .build();
    }

    @Override
    public byte[] exportCategorizedStudentsExcel(
            UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, UUID classId, String category) {
        com.acronexus.dto.ExamStudentCategorySummaryDto summary = getStudentCategorySummary(examinationId, examDate, classSubjectId, classId);
        List<com.acronexus.dto.PresentStudentDto> targetList;
        String sheetTitle;
        if ("APPEARED".equalsIgnoreCase(category)) {
            targetList = summary.getAppearedStudents();
            sheetTitle = "Appeared Students";
        } else if ("NOT_ELIGIBLE".equalsIgnoreCase(category)) {
            targetList = summary.getNotEligibleStudents();
            sheetTitle = "Not Eligible Students";
        } else if ("ALL".equalsIgnoreCase(category)) {
            targetList = summary.getAllStudents();
            sheetTitle = "All Students";
        } else {
            targetList = summary.getEligibleNotAppearedStudents();
            sheetTitle = "Eligible Not Appeared";
        }

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet(sheetTitle);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = new String[] {
                "S.No.", "Enrollment No", "Student Name", "Section", "Category", "Eligibility", "Exam Appearance", "Details / Reason"
            };
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (com.acronexus.dto.PresentStudentDto s : targetList) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(s.getEnrollmentNo() != null ? s.getEnrollmentNo() : "");
                row.createCell(2).setCellValue(s.getStudentName() != null ? s.getStudentName() : "");
                row.createCell(3).setCellValue(s.getSection() != null ? s.getSection() : "");
                row.createCell(4).setCellValue(
                    "APPEARED".equals(s.getCategory()) ? "Appeared / Result Available" :
                    ("NOT_ELIGIBLE".equals(s.getCategory()) ? "Not Eligible" : "Eligible but Not Appeared")
                );
                row.createCell(5).setCellValue(Boolean.TRUE.equals(s.getIsEligible()) ? "Eligible" : "Not Eligible");
                row.createCell(6).setCellValue(s.getAppearanceDetail() != null ? s.getAppearanceDetail() : "");
                row.createCell(7).setCellValue(
                    s.getEligibilityReason() != null && !s.getEligibilityReason().isEmpty() ? 
                    s.getEligibilityReason() : 
                    ("ELIGIBLE_NOT_APPEARED".equals(s.getCategory()) ? "Eligible but did not appear for examination" : "")
                );
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to generate Excel file", e);
        }
    }
}

