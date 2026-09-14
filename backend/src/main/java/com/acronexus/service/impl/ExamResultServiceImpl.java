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
import com.acronexus.entity.ExamAiFeedback;

@Service
@RequiredArgsConstructor
@Slf4j
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
            examinationAttendanceRepository.findPresentStudentsByContextOrdered(examinationId, examDate, classSubjectId);
        java.util.Set<UUID> presentStudentIds = attendances.stream().map(a -> a.getStudent().getId()).collect(Collectors.toSet());
            
        List<ExamResult> savedResults = repository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
        log.info("TRACE [getResultContext]: Found {} saved ExamResult records", savedResults.size());
        
        java.util.Map<UUID, ExamResult> resultMap = savedResults.stream().collect(Collectors.toMap(r -> r.getStudent().getId(), r -> r));
        
        return enrollments.stream().map(enr -> {
            com.acronexus.entity.Student s = enr.getStudent();
            String sectionDisplay = (enr.getAcroClass() != null) ? 
                (enr.getAcroClass().getSection() != null && !enr.getAcroClass().getSection().isEmpty() ? enr.getAcroClass().getSection() : enr.getAcroClass().getName()) : "";
                
            boolean isPresent = presentStudentIds.contains(s.getId());
            ExamResult res = resultMap.get(s.getId());
            
            String status = "ABSENT";
            if (isPresent) {
                if (res != null) {
                    status = res.getIsPublished() ? "Published" : "Saved";
                } else {
                    status = "Pending";
                }
            } else if (res != null) {
                status = res.getIsPublished() ? "Published" : "Saved";
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
                .attendanceStatus(isPresent ? "PRESENT" : "ABSENT")
                .isPublished(res != null ? res.getIsPublished() : false)
                .resultStatus(status)
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
}
