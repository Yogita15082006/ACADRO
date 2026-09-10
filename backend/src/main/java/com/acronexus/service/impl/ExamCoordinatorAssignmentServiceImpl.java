package com.acronexus.service.impl;

import com.acronexus.dto.ExamCapabilitiesDto;
import com.acronexus.dto.ExamCoordinatorAssignmentRequestDto;
import com.acronexus.dto.ExamCoordinatorAssignmentResponseDto;
import com.acronexus.dto.UserResponseDto;
import com.acronexus.entity.Department;
import com.acronexus.entity.ExamCoordinatorAssignment;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import org.springframework.security.access.AccessDeniedException;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.ExamCoordinatorAssignmentMapper;
import com.acronexus.mapper.UserMapper;
import com.acronexus.repository.ExamCoordinatorAssignmentRepository;
import com.acronexus.repository.FacultyRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.repository.DepartmentRepository;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.ExamCoordinatorAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamCoordinatorAssignmentServiceImpl implements ExamCoordinatorAssignmentService {

    private final ExamCoordinatorAssignmentRepository repository;
    private final ExamCoordinatorAssignmentMapper mapper;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final com.acronexus.service.UserService userService;

    private User getCurrentUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    @Override
    @Transactional
    public ExamCoordinatorAssignmentResponseDto assignCoordinator(ExamCoordinatorAssignmentRequestDto requestDto) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.HOD) {
            throw new AccessDeniedException("Only HOD can assign Exam Coordinators");
        }
        
        Department hodDepartment = currentUser.getDepartment();
        if (hodDepartment == null) {
            throw new AccessDeniedException("HOD is not assigned to a department");
        }

        User assignedUser = userRepository.findById(requestDto.getAssignedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));

        if (assignedUser.getDepartment() == null || !assignedUser.getDepartment().getId().equals(hodDepartment.getId())) {
            throw new AccessDeniedException("Assigned user does not belong to your department");
        }

        ExamCoordinatorAssignment assignment = new ExamCoordinatorAssignment();
        assignment.setAssignedUser(assignedUser);
        assignment.setDepartment(hodDepartment);
        assignment.setExamPurpose(requestDto.getExamPurpose());
        assignment.setValidUntil(requestDto.getValidUntil());
        assignment.setIsActive(true);
        assignment.setAssignedBy(currentUser);

        ExamCoordinatorAssignment saved = repository.save(assignment);
        return mapper.toDto(saved);
    }

    @Override
    @Transactional
    public void revokeAssignment(UUID assignmentId) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.HOD) {
            throw new AccessDeniedException("Only HOD can revoke Exam Coordinators");
        }

        Department hodDepartment = currentUser.getDepartment();
        if (hodDepartment == null) {
            throw new AccessDeniedException("HOD is not assigned to a department");
        }

        ExamCoordinatorAssignment assignment = repository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        if (!assignment.getDepartment().getId().equals(hodDepartment.getId())) {
            throw new AccessDeniedException("You are not authorized to revoke assignments for this department");
        }

        assignment.setIsActive(false);
        repository.save(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamCoordinatorAssignmentResponseDto> getDepartmentAssignments() {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.HOD) {
            throw new AccessDeniedException("Only HOD can view department assignments");
        }

        List<Department> hodDepartments = departmentRepository.findByHodId(currentUser.getId());
        if (hodDepartments.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        List<UUID> hodDepartmentIds = hodDepartments.stream()
                .map(Department::getId)
                .collect(Collectors.toList());

        return repository.findAllByDepartmentIdIn(hodDepartmentIds)
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamCoordinatorAssignmentResponseDto> getMyActiveAssignments() {
        User currentUser = getCurrentUser();
        return repository.findActiveAssignmentsForUser(currentUser.getId())
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDto> getEligibleFaculty() {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.HOD) {
            return java.util.Collections.emptyList();
        }

        // Delegate to the canonical scoped faculty endpoint matching Faculty Management
        return userService.getFacultyForHodScope(currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public ExamCapabilitiesDto getMyCapabilities() {
        User currentUser = getCurrentUser();
        ExamCapabilitiesDto capabilities = new ExamCapabilitiesDto();
        
        List<ExamCoordinatorAssignmentResponseDto> activeAssignments = repository.findActiveAssignmentsForUser(currentUser.getId())
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
                
        capabilities.setActiveCoordinatorAssignments(activeAssignments);
        capabilities.setCanAssignExamCoordinator(currentUser.getRole() == UserRole.HOD);
        capabilities.setCanCreateExamination(currentUser.getRole() == UserRole.HOD || !activeAssignments.isEmpty());
        
        return capabilities;
    }
}
