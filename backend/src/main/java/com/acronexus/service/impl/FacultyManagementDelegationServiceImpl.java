package com.acronexus.service.impl;

import com.acronexus.dto.FacultyManagementDelegationRequestDto;
import com.acronexus.dto.FacultyManagementDelegationResponseDto;
import com.acronexus.entity.DelegationStatus;
import com.acronexus.entity.Department;
import com.acronexus.entity.FacultyManagementDelegation;
import com.acronexus.entity.User;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.FacultyManagementDelegationMapper;
import com.acronexus.repository.DepartmentRepository;
import com.acronexus.repository.FacultyManagementDelegationRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.repository.FacultyRepository;
import com.acronexus.service.FacultyManagementDelegationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacultyManagementDelegationServiceImpl implements FacultyManagementDelegationService {

    private final FacultyManagementDelegationRepository delegationRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;

    @Override
    @Transactional
    public FacultyManagementDelegationResponseDto createDelegation(FacultyManagementDelegationRequestDto request, UUID hodId) {
        if (request.getTaskPurpose() == null || request.getTaskPurpose().trim().isEmpty()) {
            throw new IllegalArgumentException("Task purpose is required");
        }
        
        if (request.getValidUntil() == null) {
            throw new IllegalArgumentException("Valid until date is required");
        }

        User hod = userRepository.findById(hodId)
                .orElseThrow(() -> new ResourceNotFoundException("HOD not found"));
        User faculty = userRepository.findById(request.getAssignedFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
                
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
                
        // Ensure HOD manages this department
        boolean managesDepartment = department.getHod() != null && department.getHod().getId().equals(hodId);
        boolean isOwnDepartment = hod.getDepartment() != null && hod.getDepartment().getId().equals(department.getId());
        
        if (!"ADMIN".equals(hod.getRole().name()) && !managesDepartment && !isOwnDepartment) {
            throw new IllegalArgumentException("You do not have permission to manage this department");
        }
        
        // Ensure faculty belongs to the department (using same logic as frontend)
        boolean belongsToDept = userRepository.findActiveFacultyUsersByDepartmentIds(List.of(request.getDepartmentId()))
            .stream().anyMatch(u -> u.getId().equals(faculty.getId()));
            
        if (!belongsToDept) {
            throw new IllegalArgumentException("Selected faculty does not belong to the selected department");
        }

        FacultyManagementDelegation delegation = FacultyManagementDelegation.builder()
                .assignedFaculty(faculty)
                .department(department)
                .taskPurpose(request.getTaskPurpose().trim())
                .assignedBy(hod)
                .status(DelegationStatus.ACTIVE)
                .isActive(true)
                .validUntil(request.getValidUntil())
                .build();

        delegation = delegationRepository.save(delegation);
        return FacultyManagementDelegationMapper.toDto(delegation);
    }

    @Override
    @Transactional
    public FacultyManagementDelegationResponseDto completeDelegation(UUID delegationId, UUID facultyId) {
        FacultyManagementDelegation delegation = delegationRepository.findById(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException("Delegation not found"));
        
        if (!delegation.getAssignedFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("Only the assigned faculty can complete this task");
        }
        
        if (delegation.getStatus() != DelegationStatus.ACTIVE) {
            throw new IllegalArgumentException("Only ACTIVE delegations can be completed");
        }

        delegation.setStatus(DelegationStatus.COMPLETED);
        delegation.setCompletedAt(LocalDateTime.now());
        delegation.setActive(false);
        
        delegation = delegationRepository.save(delegation);
        return FacultyManagementDelegationMapper.toDto(delegation);
    }

    @Override
    @Transactional
    public FacultyManagementDelegationResponseDto revokeDelegation(UUID delegationId, UUID hodId) {
        FacultyManagementDelegation delegation = delegationRepository.findById(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException("Delegation not found"));
        
        if (!delegation.getDepartment().getHod().getId().equals(hodId)) {
            throw new IllegalArgumentException("You are not authorized to revoke this delegation");
        }

        if (delegation.getStatus() != DelegationStatus.ACTIVE) {
            throw new IllegalArgumentException("Only ACTIVE delegations can be revoked");
        }

        delegation.setStatus(DelegationStatus.REVOKED);
        delegation.setActive(false);
        
        delegation = delegationRepository.save(delegation);
        return FacultyManagementDelegationMapper.toDto(delegation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyManagementDelegationResponseDto> getDelegationsByHod(UUID hodId) {
        return delegationRepository.findByAssignedByIdOrderByAssignedAtDesc(hodId).stream()
                .map(FacultyManagementDelegationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyManagementDelegationResponseDto> getActiveDelegationsForFaculty(UUID facultyId) {
        return delegationRepository.findByAssignedFacultyIdAndStatus(facultyId, DelegationStatus.ACTIVE).stream()
                .filter(d -> d.getValidUntil() == null || d.getValidUntil().isAfter(LocalDateTime.now()))
                .map(FacultyManagementDelegationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canManageFacultySetup(UUID userId, UUID departmentId) {
        // First check if the user is the HOD for this department
        Department dept = departmentRepository.findById(departmentId).orElse(null);
        if (dept != null && dept.getHod() != null && dept.getHod().getId().equals(userId)) {
            return true;
        }
        
        // Then check if the user has an active delegation for this department
        return delegationRepository.existsActiveValidDelegation(userId, departmentId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canManageFacultySetup(UUID userId, String departmentName) {
        Department dept = departmentRepository.findByNameIgnoreCase(departmentName).orElse(null);
        if (dept == null) return false;
        return canManageFacultySetup(userId, dept.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAnyActiveDelegation(UUID userId) {
        return delegationRepository.existsAnyActiveValidDelegation(userId);
    }
}
