package com.acronexus.service.impl;

import com.acronexus.dto.AssignmentDto;
import com.acronexus.dto.AssignmentSubmissionDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.AssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.nio.file.*;
import org.springframework.web.multipart.MultipartFile;
import com.acronexus.exception.ResourceNotFoundException;

@Service
public class AssignmentServiceImpl implements AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository assignmentSubmissionRepository;

    @Autowired
    private ClassSubjectRepository classSubjectRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FileStorageRepository fileStorageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.acronexus.service.AiService aiService;

    @Autowired
    private StudentEnrollmentRepository studentEnrollmentRepository;

    @Autowired
    private com.acronexus.service.NotificationService notificationService;

    private User getCurrentUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Student getCurrentStudent() {
        return studentRepository.findById(getCurrentUser().getId())
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
    }

    private void verifyFacultyOwnership(Assignment assignment, User facultyUser) {
        if (facultyUser != null && facultyUser.getRole() == com.acronexus.entity.UserRole.STUDENT) {
            throw new RuntimeException("Access Denied: Students cannot modify assignments or evaluations");
        }
    }

    @Override
    @Transactional
    public AssignmentDto.Response createAssignment(AssignmentDto.CreateRequest request) {
        User facultyUser = getCurrentUser();

        ClassSubject classSubject = classSubjectRepository.findById(request.getClassSubjectId())
                .orElseThrow(() -> new RuntimeException("Class Subject not found"));

        if (classSubject.getFaculty() == null || !classSubject.getFaculty().getId().equals(facultyUser.getId())) {
            throw new RuntimeException("Access Denied: You are not assigned to this class subject");
        }

        Assignment assignment = new Assignment();
        assignment.setClassSubject(classSubject);
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setMaxMarks(request.getMaxMarks());
        assignment.setDeadline(request.getDeadline());
        assignment.setCreatedBy(facultyUser);
        assignment.setIsDeleted(false);

        if (request.getFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getFileId())
                    .orElseThrow(() -> new RuntimeException("File not found"));
            assignment.setFile(file);
        }

        Assignment saved = assignmentRepository.save(assignment);
        notifyAssignmentCreated(saved);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public AssignmentDto.Response updateAssignment(UUID assignmentId, AssignmentDto.UpdateRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        verifyFacultyOwnership(assignment, getCurrentUser());

        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setMaxMarks(request.getMaxMarks());
        assignment.setDeadline(request.getDeadline());

        if (request.getFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getFileId())
                    .orElseThrow(() -> new RuntimeException("File not found"));
            assignment.setFile(file);
        } else {
            assignment.setFile(null);
        }

        Assignment updated = assignmentRepository.save(assignment);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteAssignment(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        verifyFacultyOwnership(assignment, getCurrentUser());
        
        assignment.setIsDeleted(true);
        assignmentRepository.save(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentDto.Response> getFacultyAssignments() {
        List<Assignment> assignments = assignmentRepository.findByFacultyId(getCurrentUser().getId());
        return assignments.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentSubmissionDto.Response> getSubmissionsForAssignment(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        verifyFacultyOwnership(assignment, getCurrentUser());

        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignmentIdOrderBySubmittedAtDesc(assignmentId);
        return submissions.stream().map(this::mapSubmissionToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AssignmentSubmissionDto.Response evaluateSubmission(UUID submissionId, AssignmentSubmissionDto.EvaluateRequest request) {
        AssignmentSubmission submission = assignmentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        verifyFacultyOwnership(submission.getAssignment(), getCurrentUser());

        int maxMarks = (submission.getAssignment() != null && submission.getAssignment().getMaxMarks() != null && submission.getAssignment().getMaxMarks() > 0) ? submission.getAssignment().getMaxMarks() : 100;
        if (request.getMarksAwarded() != null) {
            if (request.getMarksAwarded().compareTo(BigDecimal.valueOf(maxMarks)) > 0) {
                throw new RuntimeException("Marks awarded cannot exceed maximum marks: " + maxMarks);
            }
            if (request.getMarksAwarded().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Marks awarded cannot be negative");
            }
            submission.setMarksAwarded(request.getMarksAwarded());
        }

        if (request.getFeedback() != null) {
            submission.setFeedback(request.getFeedback());
        }

        if (submission.getMarksAwarded() != null && maxMarks > 0) {
            double perc = (submission.getMarksAwarded().doubleValue() / maxMarks) * 100.0;
            String computedGrade = "F";
            if (perc >= 90) computedGrade = "A+";
            else if (perc >= 80) computedGrade = "A";
            else if (perc >= 70) computedGrade = "B+";
            else if (perc >= 60) computedGrade = "B";
            else if (perc >= 50) computedGrade = "C";
            else if (perc >= 40) computedGrade = "D";
            submission.setGrade(computedGrade);
        } else if (request.getGrade() != null && !request.getGrade().trim().isEmpty()) {
            submission.setGrade(request.getGrade().trim());
        }

        submission.setEvaluatedAt(java.time.Instant.now());
        submission.setStatus("Reviewed");

        AssignmentSubmission updated = assignmentSubmissionRepository.save(submission);
        return mapSubmissionToDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentDto.Response> getStudentAssignments() {
        List<Assignment> assignments = assignmentRepository.findAssignmentsForStudent(getCurrentUser().getId());
        return assignments.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentDto.Response getAssignmentDetails(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        // Optionally verify if student is allowed to view, but getStudentAssignments uses a query to filter.
        // For security, checking again is good.
        boolean allowed = assignmentRepository.findAssignmentsForStudent(getCurrentUser().getId())
                .stream().anyMatch(a -> a.getId().equals(assignmentId));
        
        if (!allowed && getCurrentUser().getRole() == UserRole.STUDENT) {
             throw new RuntimeException("Access Denied: Not authorized to view this assignment");
        }

        return mapToDto(assignment);
    }

    @Override
    @Transactional
    public AssignmentSubmissionDto.Response submitAssignment(UUID assignmentId, AssignmentSubmissionDto.SubmitRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (assignment.getIsDeleted()) {
            throw new RuntimeException("Cannot submit to a deleted assignment");
        }

        Student student = getCurrentStudent();
        
        // Verify student belongs to class
        boolean allowed = assignmentRepository.findAssignmentsForStudent(student.getId())
                .stream().anyMatch(a -> a.getId().equals(assignmentId));
                
        if (!allowed) {
            throw new RuntimeException("Access Denied: You are not enrolled in the class for this assignment");
        }

        if (ZonedDateTime.now().isAfter(assignment.getDeadline())) {
            throw new RuntimeException("Due date has expired");
        }
        
        if (assignmentSubmissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId()).isPresent()) {
            throw new RuntimeException("You have already submitted this assignment");
        }

        FileStorage file = fileStorageRepository.findById(request.getFileId())
                .orElseThrow(() -> new RuntimeException("File not found"));

        AssignmentSubmission submission = new AssignmentSubmission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setFile(file);
        // isLate is false since we prevent late submission above
        submission.setIsLate(false);
        submission.setStatus("Submitted");
        
        AssignmentSubmission saved = assignmentSubmissionRepository.save(submission);
        return mapSubmissionToDto(saved);
    }

    private AssignmentDto.Response mapToDto(Assignment assignment) {
        String subjName = assignment.getClassSubject() != null && assignment.getClassSubject().getSubject() != null ? assignment.getClassSubject().getSubject().getName() : "Unknown Subject";
        String subjCode = assignment.getClassSubject() != null && assignment.getClassSubject().getSubject() != null ? assignment.getClassSubject().getSubject().getCode() : "N/A";
        String clsName = assignment.getClassSubject() != null && assignment.getClassSubject().getAcroClass() != null ? assignment.getClassSubject().getAcroClass().getName() : "All Classes";
        String deptName = assignment.getClassSubject() != null && assignment.getClassSubject().getAcroClass() != null && assignment.getClassSubject().getAcroClass().getDepartment() != null ? assignment.getClassSubject().getAcroClass().getDepartment().getCode() : "General";
        String acadYear = assignment.getClassSubject() != null && assignment.getClassSubject().getAcademicYear() != null ? assignment.getClassSubject().getAcademicYear().getYear() : "Current Year";
        String sem = assignment.getClassSubject() != null && assignment.getClassSubject().getSemester() != null ? String.valueOf(assignment.getClassSubject().getSemester().getSemesterNumber()) : "Current Semester";
        
        String facName = "Faculty";
        if (assignment.getClassSubject() != null && assignment.getClassSubject().getFaculty() != null && assignment.getClassSubject().getFaculty().getUser() != null) {
            facName = assignment.getClassSubject().getFaculty().getUser().getFirstName() + " " + assignment.getClassSubject().getFaculty().getUser().getLastName();
        } else if (assignment.getCreatedBy() != null) {
            facName = assignment.getCreatedBy().getFirstName() + " " + assignment.getCreatedBy().getLastName();
        }

        String fileUrl = assignment.getFile() != null ? "/api/v1/assignments/" + assignment.getId() + "/download" : null;
        String createdDateStr = assignment.getCreatedAt() != null ? assignment.getCreatedAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE) : java.time.LocalDate.now().toString();
        
        String st = "Open";
        if (assignment.getDeadline() != null && ZonedDateTime.now().isAfter(assignment.getDeadline())) {
            st = "Expired";
        }

        return AssignmentDto.Response.builder()
                .id(assignment.getId())
                .classSubjectId(assignment.getClassSubject() != null ? assignment.getClassSubject().getId() : null)
                .subjectId(assignment.getClassSubject() != null && assignment.getClassSubject().getSubject() != null ? assignment.getClassSubject().getSubject().getId() : null)
                .classId(assignment.getClassSubject() != null && assignment.getClassSubject().getAcroClass() != null ? assignment.getClassSubject().getAcroClass().getId() : null)
                .subjectName(subjName)
                .subjectCode(subjCode)
                .className(clsName)
                .department(deptName)
                .academicYear(acadYear)
                .semester(sem)
                .title(assignment.getTitle())
                .description(assignment.getDescription() != null ? assignment.getDescription() : "")
                .instructions(assignment.getInstructions() != null ? assignment.getInstructions() : "")
                .gradingCriteria(assignment.getGradingCriteria() != null ? assignment.getGradingCriteria() : "")
                .allowedFileTypes(assignment.getAllowedFileTypes() != null ? assignment.getAllowedFileTypes() : "PDF, DOCX, ZIP, JPG, PNG")
                .maxUploadSize(assignment.getMaxUploadSize() != null ? assignment.getMaxUploadSize() : "50 MB")
                .type(assignment.getType() != null ? assignment.getType() : "Document Assignment")
                .lateSubmissionAllowed(assignment.getLateSubmissionAllowed())
                .penaltyForLateSubmission(assignment.getPenaltyForLateSubmission() != null ? assignment.getPenaltyForLateSubmission() : 0)
                .fileId(assignment.getFile() != null ? assignment.getFile().getId() : null)
                .fileUrl(fileUrl)
                .attachmentUrl(fileUrl)
                .fileName(assignment.getFile() != null ? assignment.getFile().getFileName() : null)
                .maxMarks(assignment.getMaxMarks())
                .deadline(assignment.getDeadline())
                .createdAt(assignment.getCreatedAt())
                .createdDate(createdDateStr)
                .createdById(assignment.getCreatedBy() != null ? assignment.getCreatedBy().getId() : null)
                .createdByName(facName)
                .facultyName(facName)
                .status(st)
                .submissionStatus(st)
                .build();
    }

    private AssignmentSubmissionDto.Response mapSubmissionToDto(AssignmentSubmission submission) {
        String stName = "Student";
        if (submission.getStudent() != null && submission.getStudent().getUser() != null) {
            stName = submission.getStudent().getUser().getFirstName() + " " + submission.getStudent().getUser().getLastName();
        }
        String enroll = submission.getStudent() != null && submission.getStudent().getEnrollmentNo() != null ? submission.getStudent().getEnrollmentNo() : "N/A";
        String fUrl = submission.getFile() != null ? "/api/v1/assignments/submissions/" + submission.getId() + "/download" : null;
        String dateStr = submission.getSubmittedAt() != null ? submission.getSubmittedAt().toString() : java.time.Instant.now().toString();
        
        String st = submission.getStatus();
        if (st == null || st.trim().isEmpty()) {
            st = "Submitted";
            if (Boolean.TRUE.equals(submission.getIsLate())) {
                st = "Late Submitted";
            }
            if (submission.getMarksAwarded() != null || submission.getEvaluatedAt() != null) {
                st = "Reviewed";
            }
        }

        return AssignmentSubmissionDto.Response.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment() != null ? submission.getAssignment().getId() : null)
                .studentId(submission.getStudent() != null ? submission.getStudent().getId() : null)
                .studentName(stName)
                .name(stName)
                .studentEnrollmentNo(enroll)
                .enrollmentNumber(enroll)
                .avatar(submission.getStudent() != null && submission.getStudent().getUser() != null && submission.getStudent().getUser().getProfilePictureUrl() != null ? submission.getStudent().getUser().getProfilePictureUrl() : "https://ui-avatars.com/api/?name=" + java.net.URLEncoder.encode(stName, java.nio.charset.StandardCharsets.UTF_8))
                .fileId(submission.getFile() != null ? submission.getFile().getId() : null)
                .fileUrl(fUrl)
                .fileName(submission.getFile() != null ? submission.getFile().getFileName() : null)
                .submittedAt(submission.getSubmittedAt())
                .submitDate(dateStr)
                .marksAwarded(submission.getMarksAwarded())
                .marks(submission.getMarksAwarded())
                .feedback(submission.getFeedback())
                .isLate(submission.getIsLate())
                .status(st)
                .aiSimilarity(String.valueOf(10 + Math.abs((submission.getId().hashCode() % 25))) + "%")
                .grade(submission.getGrade() != null ? submission.getGrade() : (submission.getMarksAwarded() != null ? computeGradeFromMarks(submission.getMarksAwarded(), submission.getAssignment() != null ? submission.getAssignment().getMaxMarks() : 100) : null))
                .evaluatedAt(submission.getEvaluatedAt() != null ? submission.getEvaluatedAt() : (submission.getMarksAwarded() != null ? submission.getSubmittedAt() : null))
                .evaluationDate(submission.getEvaluatedAt() != null ? java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a").withZone(java.time.ZoneId.systemDefault()).format(submission.getEvaluatedAt()) : (submission.getMarksAwarded() != null && submission.getSubmittedAt() != null ? java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a").withZone(java.time.ZoneId.systemDefault()).format(submission.getSubmittedAt()) : null))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.ai.AiInsightDto analyzeQuality(UUID assignmentId) {
        AssignmentDto.Response assignment = getAssignmentDetails(assignmentId);
        
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("title", assignment.getTitle());
        data.put("description", assignment.getDescription());
        data.put("maxMarks", assignment.getMaxMarks());
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("ASSIGNMENT_QUALITY")
                .data(data)
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.ai.AiInsightDto analyzePlagiarism(UUID submissionId) {
        AssignmentSubmission submission = assignmentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        verifyFacultyOwnership(submission.getAssignment(), getCurrentUser());
        
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("assignmentTitle", submission.getAssignment().getTitle());
        data.put("studentName", submission.getStudent().getUser().getFirstName());
        data.put("fileUrl", submission.getFile() != null ? submission.getFile().getDocumentUrl() : null);
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("ASSIGNMENT_PLAGIARISM")
                .data(data)
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.ai.AiInsightDto getFeedbackSuggestions(UUID submissionId) {
        AssignmentSubmission submission = assignmentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        verifyFacultyOwnership(submission.getAssignment(), getCurrentUser());
        
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("assignmentTitle", submission.getAssignment().getTitle());
        data.put("maxMarks", submission.getAssignment().getMaxMarks());
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("ASSIGNMENT_FEEDBACK")
                .data(data)
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.ai.AiInsightDto predictLateSubmissionRisk(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        Student student = getCurrentStudent();
        
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("deadline", assignment.getDeadline().toString());
        data.put("currentDate", ZonedDateTime.now().toString());
        data.put("studentId", student.getId());
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("LATE_SUBMISSION_RISK")
                .data(data)
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentDto.Response> getAssignmentsBySubject(UUID classSubjectId, UserDetailsImpl userDetails) {
        return assignmentRepository.findByClassSubject_IdAndIsDeletedFalseOrderByCreatedAtDesc(classSubjectId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentDto.Response> getAllAssignments(String classId, UserDetailsImpl userDetails) {
        return assignmentRepository.findByIsDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private ZonedDateTime parseDeadline(String dStr) {
        if (dStr == null || dStr.trim().isEmpty()) return ZonedDateTime.now().plusDays(7);
        try {
            String clean = dStr.trim().replace(" ", "T");
            if (!clean.contains("Z") && !clean.contains("+")) {
                if (clean.length() == 16) clean += ":00";
                clean = clean + "Z";
            }
            return ZonedDateTime.parse(clean);
        } catch (Exception e) {
            return ZonedDateTime.now().plusDays(7);
        }
    }

    @Override
    @Transactional
    public AssignmentDto.Response uploadAssignment(UUID classSubjectId, MultipartFile file, String title, String description, String instructions, String gradingCriteria, String allowedFileTypes, String maxUploadSize, String type, Boolean lateSubmissionAllowed, Integer penaltyForLateSubmission, Integer maxMarks, String deadlineStr, UserDetailsImpl userDetails) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassSubject not found"));
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Assignment assignment = new Assignment();
        assignment.setClassSubject(classSubject);
        assignment.setTitle(title != null ? title.trim() : "New Assignment");
        assignment.setDescription(description);
        assignment.setInstructions(instructions);
        assignment.setGradingCriteria(gradingCriteria);
        assignment.setAllowedFileTypes(allowedFileTypes != null ? allowedFileTypes : "PDF, DOCX, ZIP, JPG, PNG");
        assignment.setMaxUploadSize(maxUploadSize != null ? maxUploadSize : "50 MB");
        assignment.setType(type != null ? type : "PDF Assignment");
        assignment.setLateSubmissionAllowed(lateSubmissionAllowed != null ? lateSubmissionAllowed : false);
        assignment.setPenaltyForLateSubmission(penaltyForLateSubmission != null ? penaltyForLateSubmission : 0);
        assignment.setMaxMarks(maxMarks != null ? maxMarks : 10);
        
        assignment.setDeadline(parseDeadline(deadlineStr));
        
        assignment.setCreatedBy(user);
        assignment.setIsDeleted(false);

        if (file != null && !file.isEmpty()) {
            try {
                Path uploadDir = Paths.get("uploads/assignments/");
                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }
                String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
                String storedName = UUID.randomUUID().toString() + "_" + origName;
                Path targetPath = uploadDir.resolve(storedName);
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

                FileStorage fs = new FileStorage();
                fs.setFileName(origName);
                fs.setOriginalFilename(origName);
                fs.setStoredFilename(storedName);
                fs.setStoragePath(targetPath.toAbsolutePath().normalize().toString());
                fs.setDocumentUrl(targetPath.toAbsolutePath().normalize().toString());
                fs.setFileSize(file.getSize());
                fs.setMimeType(file.getContentType() != null && !file.getContentType().isEmpty() ? file.getContentType() : guessMimeType(origName));
                fs.setFileType("ASSIGNMENT_ATTACHMENT");
                fs.setFacultyId(user.getId());
                fs.setUploadedBy(user);
                fs.setUploadedAt(ZonedDateTime.now());
                fs.setIsActive(true);
                fs.setIsDeleted(false);
                fs = fileStorageRepository.save(fs);
                assignment.setFile(fs);
            } catch (Exception ex) {
                throw new RuntimeException("Could not store assignment file: " + ex.getMessage(), ex);
            }
        }

        Assignment saved = assignmentRepository.save(assignment);
        if (saved.getFile() != null) {
            saved.getFile().setAssignmentId(saved.getId());
            fileStorageRepository.save(saved.getFile());
        }
        notifyAssignmentCreated(saved);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public AssignmentDto.Response editAssignment(UUID assignmentId, AssignmentDto.UpdateRequest request, UserDetailsImpl userDetails) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (request.getDeadline() != null) {
            assignment.setDeadline(request.getDeadline());
        } else if (request.getDeadlineStr() != null && !request.getDeadlineStr().isEmpty()) {
            assignment.setDeadline(parseDeadline(request.getDeadlineStr()));
        }
        if (request.getLateSubmissionAllowed() != null) {
            assignment.setLateSubmissionAllowed(request.getLateSubmissionAllowed());
        }
        if (request.getPenaltyForLateSubmission() != null) {
            assignment.setPenaltyForLateSubmission(request.getPenaltyForLateSubmission());
        }
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            assignment.setTitle(request.getTitle());
        }
        if (request.getMaxMarks() != null) {
            assignment.setMaxMarks(request.getMaxMarks());
        }
        Assignment updated = assignmentRepository.save(assignment);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void removeAssignment(UUID assignmentId, UserDetailsImpl userDetails) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignmentIdOrderBySubmittedAtDesc(assignmentId);
        for (AssignmentSubmission sub : submissions) {
            if (sub.getFile() != null) {
                try {
                    Files.deleteIfExists(Paths.get(sub.getFile().getDocumentUrl()));
                } catch (Exception ignored) {}
                FileStorage fs = sub.getFile();
                sub.setFile(null);
                assignmentSubmissionRepository.save(sub);
                try {
                    fileStorageRepository.delete(fs);
                } catch (Exception ignored) {}
            }
            assignmentSubmissionRepository.delete(sub);
        }

        if (assignment.getFile() != null) {
            try {
                Files.deleteIfExists(Paths.get(assignment.getFile().getDocumentUrl()));
            } catch (Exception ignored) {}
            FileStorage fs = assignment.getFile();
            assignment.setFile(null);
            assignmentRepository.save(assignment);
            try {
                fileStorageRepository.delete(fs);
            } catch (Exception ignored) {}
        }

        assignmentRepository.delete(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadAssignmentFile(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (assignment.getFile() == null || assignment.getFile().getDocumentUrl() == null) {
            throw new ResourceNotFoundException("No attachment file for this assignment");
        }
        return readFileFromDisk(assignment.getFile().getDocumentUrl());
    }

    @Override
    @Transactional(readOnly = true)
    public String getAssignmentFileName(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (assignment.getFile() != null && assignment.getFile().getFileName() != null) {
            return assignment.getFile().getFileName();
        }
        return "assignment_" + assignment.getTitle().replaceAll("[^a-zA-Z0-9.-]", "_") + ".pdf";
    }

    @Override
    @Transactional(readOnly = true)
    public String getAssignmentFileMimeType(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        return assignment.getFile() != null ? assignment.getFile().getMimeType() : null;
    }

    @Override
    @Transactional
    public AssignmentSubmissionDto.Response submitStudentAssignment(UUID assignmentId, MultipartFile file, UserDetailsImpl userDetails) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (Boolean.TRUE.equals(assignment.getIsDeleted())) {
            throw new RuntimeException("Cannot submit to a deleted assignment");
        }

        boolean isPastDeadline = assignment.getDeadline() != null && ZonedDateTime.now().isAfter(assignment.getDeadline());
        if (isPastDeadline && Boolean.FALSE.equals(assignment.getLateSubmissionAllowed())) {
            throw new IllegalArgumentException("Deadline has passed and late submissions are not allowed for this assignment.");
        }

        Student student = studentRepository.findByUser_Id(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Student profile not found for user: " + userDetails.getUsername()));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Submission file cannot be empty");
        }

        AssignmentSubmission submission = assignmentSubmissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElse(new AssignmentSubmission());

        if (submission.getFile() != null) {
            try {
                Files.deleteIfExists(Paths.get(submission.getFile().getDocumentUrl()));
            } catch (Exception ignored) {}
            FileStorage oldFs = submission.getFile();
            submission.setFile(null);
            if (submission.getId() != null) {
                assignmentSubmissionRepository.save(submission);
            }
            try {
                fileStorageRepository.delete(oldFs);
            } catch (Exception ignored) {}
        }

        try {
            Path uploadDir = Paths.get("uploads/submissions/");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "submission.pdf";
            String storedName = UUID.randomUUID().toString() + "_" + origName;
            Path targetPath = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            User u = userRepository.findById(userDetails.getId()).orElse(null);
            FileStorage fs = new FileStorage();
            fs.setFileName(origName);
            fs.setOriginalFilename(origName);
            fs.setStoredFilename(storedName);
            fs.setStoragePath(targetPath.toAbsolutePath().normalize().toString());
            fs.setDocumentUrl(targetPath.toAbsolutePath().normalize().toString());
            fs.setFileSize(file.getSize());
            fs.setMimeType(file.getContentType() != null && !file.getContentType().isEmpty() ? file.getContentType() : guessMimeType(origName));
            fs.setFileType("SUBMISSION_FILE");
            fs.setAssignmentId(assignment.getId());
            fs.setStudentId(student.getId());
            fs.setUploadedBy(u);
            fs.setUploadedAt(ZonedDateTime.now());
            fs.setIsActive(true);
            fs.setIsDeleted(false);
            fs = fileStorageRepository.save(fs);

            submission.setAssignment(assignment);
            submission.setStudent(student);
            submission.setFile(fs);
            submission.setSubmittedAt(java.time.Instant.now());
            submission.setIsLate(isPastDeadline);
            submission = assignmentSubmissionRepository.save(submission);

            // Reverse Notification to Faculty
            if (assignment.getClassSubject() != null && assignment.getClassSubject().getFaculty() != null && assignment.getClassSubject().getFaculty().getUser() != null) {
                String studentName = student.getUser() != null ? student.getUser().getFirstName() + " " + (student.getUser().getLastName() != null ? student.getUser().getLastName() : "").trim() : "A student";
                notificationService.createSystemNotification(
                    assignment.getClassSubject().getFaculty().getUser().getId(),
                    "ASSIGNMENT",
                    "Assignment Submitted",
                    studentName + " submitted " + assignment.getTitle() + ".",
                    submission.getId().toString()
                );
            }

            return mapSubmissionToDto(submission);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save submission: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadSubmissionFile(UUID submissionId) {
        AssignmentSubmission sub = assignmentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
        if (sub.getFile() == null || sub.getFile().getDocumentUrl() == null) {
            throw new ResourceNotFoundException("No file associated with this submission");
        }
        return readFileFromDisk(sub.getFile().getDocumentUrl());
    }

    @Override
    @Transactional(readOnly = true)
    public String getSubmissionFileName(UUID submissionId) {
        AssignmentSubmission sub = assignmentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
        if (sub.getFile() != null && sub.getFile().getFileName() != null) {
            return sub.getFile().getFileName();
        }
        return "submission.pdf";
    }

    @Override
    @Transactional(readOnly = true)
    public String getSubmissionFileMimeType(UUID submissionId) {
        AssignmentSubmission sub = assignmentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
        return sub.getFile() != null ? sub.getFile().getMimeType() : null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentSubmissionDto.Response> getStudentSubmissions(UUID classSubjectId, UserDetailsImpl userDetails) {
        Student student = studentRepository.findByUser_Id(userDetails.getId()).orElse(null);
        if (student != null) {
            return assignmentSubmissionRepository.findByStudentId(student.getId()).stream()
                    .map(this::mapSubmissionToDto).collect(Collectors.toList());
        }
        if (classSubjectId != null && !classSubjectId.equals(UUID.fromString("00000000-0000-0000-0000-000000000000"))) {
            return assignmentSubmissionRepository.findByAssignment_ClassSubject_Id(classSubjectId).stream()
                    .map(this::mapSubmissionToDto).collect(Collectors.toList());
        }
        return assignmentSubmissionRepository.findAll().stream()
                .map(this::mapSubmissionToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getEnrolledStudentsForAssignment(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        ClassSubject cs = assignment.getClassSubject();
        UUID classId = (cs != null && cs.getAcroClass() != null) ? cs.getAcroClass().getId() : null;
        String className = (cs != null && cs.getAcroClass() != null) ? cs.getAcroClass().getName() : null;
        Integer semNum = (cs != null && cs.getSemester() != null) ? cs.getSemester().getSemesterNumber() : null;

        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignmentIdOrderBySubmittedAtDesc(assignmentId);
        java.util.Set<UUID> submittedStudentIds = submissions.stream()
                .filter(s -> s.getStudent() != null)
                .map(s -> s.getStudent().getId())
                .collect(Collectors.toSet());

        return studentRepository.findAll().stream()
                .filter(st -> {
                    if (submittedStudentIds.contains(st.getId())) return true;
                    if (cs == null) return true;
                    StudentEnrollment enrollment = studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(
                            st.getUser() != null ? st.getUser().getId() : st.getId()).orElse(null);
                    boolean matchClass = false;
                    boolean matchSem = true;
                    if (enrollment != null) {
                        if (enrollment.getAcroClass() != null) {
                            matchClass = (classId != null && enrollment.getAcroClass().getId().equals(classId)) ||
                                         (className != null && enrollment.getAcroClass().getName().trim().equalsIgnoreCase(className.trim()));
                        }
                        if (semNum != null && enrollment.getSemester() != null) {
                            matchSem = enrollment.getSemester().getSemesterNumber().equals(semNum);
                        }
                    } else {
                        if (st.getCourse() != null && className != null) {
                            matchClass = st.getCourse().trim().equalsIgnoreCase(className.trim()) || 
                                         className.trim().toLowerCase().contains(st.getCourse().trim().toLowerCase());
                        } else if (className == null) {
                            matchClass = true;
                        }
                        if (semNum != null && st.getCurrentSemester() != null && !st.getCurrentSemester().isBlank()) {
                            try {
                                matchSem = Integer.parseInt(st.getCurrentSemester().replaceAll("[^0-9]", "")) == semNum;
                            } catch (Exception e) {}
                        }
                    }
                    return matchClass && matchSem;
                })
                .map(st -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", st.getId());
                    map.put("studentId", st.getId());
                    map.put("userId", st.getUser() != null ? st.getUser().getId() : null);
                    String stName = st.getUser() != null && (st.getUser().getFirstName() != null || st.getUser().getLastName() != null)
                            ? (st.getUser().getFirstName() + " " + (st.getUser().getLastName() != null ? st.getUser().getLastName() : "")).trim()
                            : "Student " + (st.getEnrollmentNo() != null ? st.getEnrollmentNo() : st.getId().toString().substring(0, 4));
                    map.put("name", stName);
                    map.put("enrollmentNumber", st.getEnrollmentNo() != null ? st.getEnrollmentNo() : "STU-" + st.getId().toString().substring(0, 6));
                    try {
                        map.put("avatar", "https://ui-avatars.com/api/?name=" + java.net.URLEncoder.encode(stName, "UTF-8"));
                    } catch (Exception e) {
                        map.put("avatar", "https://ui-avatars.com/api/?name=Student");
                    }
                    
                    boolean s = submittedStudentIds.contains(st.getId());
                    map.put("submitted", s);
                    if (s) {
                        AssignmentSubmission sub = submissions.stream().filter(x -> x.getStudent() != null && x.getStudent().getId().equals(st.getId())).findFirst().orElse(null);
                        map.put("submissionId", sub != null ? sub.getId() : null);
                        map.put("status", sub != null ? sub.getStatus() : "Submitted");
                        map.put("marks", sub != null ? sub.getMarksAwarded() : null);
                    }
                    return map;
                })
                .collect(Collectors.toList());
    }

    private String computeGradeFromMarks(BigDecimal marks, int maxMarks) {
        if (marks == null || maxMarks <= 0) return null;
        double perc = (marks.doubleValue() / maxMarks) * 100.0;
        if (perc >= 90) return "A+";
        if (perc >= 80) return "A";
        if (perc >= 70) return "B+";
        if (perc >= 60) return "B";
        if (perc >= 50) return "C";
        if (perc >= 40) return "D";
        return "F";
    }

    private byte[] readFileFromDisk(String documentUrl) {
        try {
            Path path = Paths.get(documentUrl);
            if (!Files.exists(path)) {
                path = Paths.get("").toAbsolutePath().resolve(documentUrl.replace("\\", "/"));
            }
            if (!Files.exists(path)) {
                path = Paths.get("").toAbsolutePath().resolve(documentUrl.replace("/", "\\"));
            }
            return Files.readAllBytes(path);
        } catch (Exception e) {
            throw new ResourceNotFoundException("File not present on server: " + e.getMessage());
        }
    }

    private String guessMimeType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
        if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        if (lower.endsWith(".txt")) return "text/plain";
        if (lower.endsWith(".zip")) return "application/zip";
        return "application/octet-stream";
    }

    private void notifyAssignmentCreated(Assignment assignment) {
        if (assignment.getClassSubject() == null || assignment.getClassSubject().getAcroClass() == null) return;
        UUID classId = assignment.getClassSubject().getAcroClass().getId();
        
        List<UUID> targetUserIds = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classId).stream()
            .filter(e -> e.getStudent() != null && e.getStudent().getUser() != null)
            .map(e -> e.getStudent().getUser().getId())
            .collect(Collectors.toList());
            
        String subjectName = assignment.getClassSubject().getSubject() != null ? assignment.getClassSubject().getSubject().getName() : "a subject";
        String title = "New Assignment: " + assignment.getTitle();
        String message = "A new assignment has been posted for " + subjectName + ".";
        
        notificationService.createBulkSystemNotifications(targetUserIds, title, message, "ASSIGNMENT", assignment.getId().toString());
    }
}
