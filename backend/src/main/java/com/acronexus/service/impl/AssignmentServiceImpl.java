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
        if (!assignment.getCreatedBy().getId().equals(facultyUser.getId())) {
            throw new RuntimeException("Access Denied: You do not own this assignment");
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

        if (request.getMarksAwarded().compareTo(BigDecimal.valueOf(submission.getAssignment().getMaxMarks())) > 0) {
            throw new RuntimeException("Marks awarded cannot exceed maximum marks: " + submission.getAssignment().getMaxMarks());
        }
        
        if (request.getMarksAwarded().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Marks awarded cannot be negative");
        }

        submission.setMarksAwarded(request.getMarksAwarded());
        submission.setFeedback(request.getFeedback());

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
        
        AssignmentSubmission saved = assignmentSubmissionRepository.save(submission);
        return mapSubmissionToDto(saved);
    }

    private AssignmentDto.Response mapToDto(Assignment assignment) {
        return AssignmentDto.Response.builder()
                .id(assignment.getId())
                .classSubjectId(assignment.getClassSubject().getId())
                .subjectName(assignment.getClassSubject().getSubject().getName())
                .className(assignment.getClassSubject().getAcroClass().getName())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .fileId(assignment.getFile() != null ? assignment.getFile().getId() : null)
                .fileUrl(assignment.getFile() != null ? assignment.getFile().getDocumentUrl() : null)
                .fileName(assignment.getFile() != null ? assignment.getFile().getFileName() : null)
                .maxMarks(assignment.getMaxMarks())
                .deadline(assignment.getDeadline())
                .createdAt(assignment.getCreatedAt())
                .createdById(assignment.getCreatedBy().getId())
                .createdByName(assignment.getCreatedBy().getFirstName() + " " + assignment.getCreatedBy().getLastName())
                .build();
    }

    private AssignmentSubmissionDto.Response mapSubmissionToDto(AssignmentSubmission submission) {
        return AssignmentSubmissionDto.Response.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment().getId())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getUser().getFirstName() + " " + submission.getStudent().getUser().getLastName())
                .studentEnrollmentNo(submission.getStudent().getEnrollmentNo())
                .fileId(submission.getFile() != null ? submission.getFile().getId() : null)
                .fileUrl(submission.getFile() != null ? submission.getFile().getDocumentUrl() : null)
                .fileName(submission.getFile() != null ? submission.getFile().getFileName() : null)
                .submittedAt(submission.getSubmittedAt())
                .marksAwarded(submission.getMarksAwarded())
                .feedback(submission.getFeedback())
                .isLate(submission.getIsLate())
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
}
