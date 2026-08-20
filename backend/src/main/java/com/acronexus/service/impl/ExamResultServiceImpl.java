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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamResultServiceImpl implements ExamResultService {

    private final ExamResultRepository repository;
    private final ExamResultMapper mapper;
    private final ExamResultsHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final com.acronexus.repository.ExamAiFeedbackRepository aiFeedbackRepository;

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
            results = repository.findByStudentIdAndIsPublishedTrue(currentUser.getId());
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
            results = repository.findByExaminationIdAndStudentIdAndIsPublishedTrue(examinationId, currentUser.getId());
        } else if (className != null && !className.trim().isEmpty()) {
            results = repository.findByExaminationIdAndClassName(examinationId, className);
        } else {
            results = repository.findByExaminationId(examinationId);
        }
        
        return results.stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    private void verifyStudentAccess(ExamResult result) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        if (currentUser.getRole() == UserRole.STUDENT && !result.getStudent().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access Denied: You can only view your own exam results");
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
}
