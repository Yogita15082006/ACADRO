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
}
