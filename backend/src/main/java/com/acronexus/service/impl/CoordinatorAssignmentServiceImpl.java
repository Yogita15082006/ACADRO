package com.acronexus.service.impl;

import com.acronexus.dto.CoordinatorAssignmentRequestDto;
import com.acronexus.dto.CoordinatorAssignmentResponseDto;
import com.acronexus.entity.CoordinatorAssignment;
import com.acronexus.entity.User;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.CoordinatorAssignmentMapper;
import com.acronexus.repository.CoordinatorAssignmentRepository;
import com.acronexus.service.CoordinatorAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoordinatorAssignmentServiceImpl implements CoordinatorAssignmentService {

    private final CoordinatorAssignmentRepository repository;
    private final com.acronexus.repository.UserRepository userRepository;
    private final com.acronexus.repository.FacultyRepository facultyRepository;
    private final com.acronexus.repository.AcroClassRepository acroClassRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public CoordinatorAssignmentResponseDto create(CoordinatorAssignmentRequestDto requestDto) {
        User user = userRepository.findById(requestDto.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + requestDto.getFacultyId()));
        
        if (user.getRole() != com.acronexus.entity.UserRole.COORDINATOR && user.getRole() != com.acronexus.entity.UserRole.HOD) {
            user.setRole(com.acronexus.entity.UserRole.COORDINATOR);
            userRepository.save(user);
        }
        
        com.acronexus.entity.Faculty faculty = facultyRepository.findById(user.getId()).orElse(null);
        if (faculty != null && ("Faculty".equalsIgnoreCase(faculty.getDesignation()) || "Assistant Professor".equalsIgnoreCase(faculty.getDesignation()) || faculty.getDesignation() == null || faculty.getDesignation().isBlank())) {
            faculty.setDesignation("Coordinator");
            facultyRepository.save(faculty);
        }
        
        List<CoordinatorAssignment> existing = repository.findByCoordinatorId(user.getId());
        if (!existing.isEmpty()) {
            repository.deleteAll(existing);
            repository.flush();
        }
        
        List<CoordinatorAssignment> createdAssignments = new java.util.ArrayList<>();
        if (requestDto.getAssignments() != null) {
            for (CoordinatorAssignmentRequestDto.AssignmentDetail detail : requestDto.getAssignments()) {
                CoordinatorAssignment ca = new CoordinatorAssignment();
                ca.setCoordinator(user);
                ca.setClassName(detail.getClassName());
                ca.setBatch(detail.getBatch());
                ca.setAcademicYear(detail.getAcademicYear());
                ca.setSemester(detail.getSemester());
                ca.setEffectiveFrom(java.time.LocalDate.now());
                createdAssignments.add(repository.save(ca));
            }
        }
        
        return buildDto(user, faculty, createdAssignments);
    }

    private CoordinatorAssignmentResponseDto buildDto(User user, com.acronexus.entity.Faculty faculty, List<CoordinatorAssignment> assignments) {
        CoordinatorAssignmentResponseDto dto = new CoordinatorAssignmentResponseDto();
        dto.setId(user.getId());
        dto.setName(user.getFirstName() + " " + user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setEmpId(faculty != null ? faculty.getEmployeeId() : "");
        
        List<CoordinatorAssignmentResponseDto.AssignmentDetail> details = new java.util.ArrayList<>();
        if (assignments != null) {
            for (CoordinatorAssignment ca : assignments) {
                CoordinatorAssignmentResponseDto.AssignmentDetail detail = new CoordinatorAssignmentResponseDto.AssignmentDetail();
                detail.setClassName(ca.getClassName());
                detail.setBatch(ca.getBatch());
                detail.setAcademicYear(ca.getAcademicYear());
                detail.setSemester(ca.getSemester());
                details.add(detail);
            }
        }
        dto.setAssignments(details);
        
        dto.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : java.time.LocalDateTime.now().toString());
        return dto;
    }

    @Override
    public CoordinatorAssignmentResponseDto getById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coordinator not found with id: " + id));
        com.acronexus.entity.Faculty faculty = facultyRepository.findById(user.getId()).orElse(null);
        
        List<CoordinatorAssignment> assignments = repository.findByCoordinatorId(user.getId());
        return buildDto(user, faculty, assignments);
    }

    @Override
    public List<CoordinatorAssignmentResponseDto> getAll() {
        List<User> coordinators = userRepository.findAll().stream()
                .filter(u -> (u.getRole() == com.acronexus.entity.UserRole.COORDINATOR || u.getRole() == com.acronexus.entity.UserRole.HOD) && !Boolean.TRUE.equals(u.getIsDeleted()))
                .collect(Collectors.toList());
        
        return coordinators.stream().map(u -> {
            com.acronexus.entity.Faculty f = facultyRepository.findById(u.getId()).orElse(null);
            List<CoordinatorAssignment> assignments = repository.findByCoordinatorId(u.getId());
            return buildDto(u, f, assignments);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CoordinatorAssignmentResponseDto update(UUID id, CoordinatorAssignmentRequestDto requestDto) {
        // Since we changed how creating works (mapping an existing user), update is basically identical to create.
        requestDto.setFacultyId(id);
        return create(requestDto);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coordinator not found with id: " + id));
        
        List<CoordinatorAssignment> assignments = repository.findByCoordinatorId(user.getId());
        repository.deleteAll(assignments);
        
        if (user.getRole() == com.acronexus.entity.UserRole.COORDINATOR) {
            user.setRole(com.acronexus.entity.UserRole.FACULTY);
            userRepository.save(user);
        }
    }
}

