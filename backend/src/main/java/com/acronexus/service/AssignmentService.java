package com.acronexus.service;

import com.acronexus.dto.AssignmentDto;
import com.acronexus.dto.AssignmentSubmissionDto;

import java.util.List;
import java.util.UUID;

public interface AssignmentService {
    
    // Faculty features
    AssignmentDto.Response createAssignment(AssignmentDto.CreateRequest request);
    AssignmentDto.Response updateAssignment(UUID assignmentId, AssignmentDto.UpdateRequest request);
    void deleteAssignment(UUID assignmentId);
    List<AssignmentDto.Response> getFacultyAssignments();
    
    // Faculty evaluation
    List<AssignmentSubmissionDto.Response> getSubmissionsForAssignment(UUID assignmentId);
    AssignmentSubmissionDto.Response evaluateSubmission(UUID submissionId, AssignmentSubmissionDto.EvaluateRequest request);
    
    // Student features
    List<AssignmentDto.Response> getStudentAssignments();
    AssignmentDto.Response getAssignmentDetails(UUID assignmentId);
    AssignmentSubmissionDto.Response submitAssignment(UUID assignmentId, AssignmentSubmissionDto.SubmitRequest request);
    
    // AI Features
    com.acronexus.dto.ai.AiInsightDto analyzeQuality(UUID assignmentId);
    com.acronexus.dto.ai.AiInsightDto analyzePlagiarism(UUID submissionId);
    com.acronexus.dto.ai.AiInsightDto getFeedbackSuggestions(UUID submissionId);
    com.acronexus.dto.ai.AiInsightDto predictLateSubmissionRisk(UUID assignmentId);

    // Dynamic LMS Features
    List<AssignmentDto.Response> getAssignmentsBySubject(UUID classSubjectId, com.acronexus.security.UserDetailsImpl userDetails);
    List<AssignmentDto.Response> getAllAssignments(String classId, com.acronexus.security.UserDetailsImpl userDetails);
    AssignmentDto.Response uploadAssignment(UUID classSubjectId, org.springframework.web.multipart.MultipartFile file, String title, String description, String instructions, String gradingCriteria, String allowedFileTypes, String maxUploadSize, String type, Boolean lateSubmissionAllowed, Integer penaltyForLateSubmission, Integer maxMarks, String deadlineStr, com.acronexus.security.UserDetailsImpl userDetails);
    AssignmentDto.Response editAssignment(UUID assignmentId, AssignmentDto.UpdateRequest request, com.acronexus.security.UserDetailsImpl userDetails);
    void removeAssignment(UUID assignmentId, com.acronexus.security.UserDetailsImpl userDetails);
    byte[] downloadAssignmentFile(UUID assignmentId);
    String getAssignmentFileName(UUID assignmentId);
    String getAssignmentFileMimeType(UUID assignmentId);

    AssignmentSubmissionDto.Response submitStudentAssignment(UUID assignmentId, org.springframework.web.multipart.MultipartFile file, com.acronexus.security.UserDetailsImpl userDetails);
    byte[] downloadSubmissionFile(UUID submissionId);
    String getSubmissionFileName(UUID submissionId);
    String getSubmissionFileMimeType(UUID submissionId);
    List<AssignmentSubmissionDto.Response> getStudentSubmissions(UUID classSubjectId, com.acronexus.security.UserDetailsImpl userDetails);
    List<java.util.Map<String, Object>> getEnrolledStudentsForAssignment(UUID assignmentId);
}
