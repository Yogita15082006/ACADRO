package com.acronexus.service;

import com.acronexus.dto.UserRequestDto;
import com.acronexus.dto.UserResponseDto;
import com.acronexus.entity.Faculty;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.UserMapper;
import com.acronexus.repository.FacultyRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.CoordinatorAssignmentRepository;
import com.acronexus.repository.TimetableSlotRepository;
import com.acronexus.entity.ClassSubject;
import com.acronexus.entity.CoordinatorAssignment;
import com.acronexus.entity.TimetableSlot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final UserMapper userMapper;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponseDto createUser(UserRequestDto requestDto) {
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new IllegalArgumentException("Error: Email is already taken!");
        }

        User user = userMapper.toEntity(requestDto);
        user.setPasswordHash(passwordEncoder.encode(requestDto.getPassword()));
        
        User savedUser = userRepository.save(user);
        return userMapper.toDto(savedUser);
    }

    @Transactional(readOnly = true)
    public UserResponseDto getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        Faculty faculty = facultyRepository.findById(id).orElse(null);
        return userMapper.toDto(user, faculty);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDto> getAllUsers() {
        List<User> users = userRepository.findAll();
        
        // Batch-load all faculty records to avoid N+1 queries
        Map<UUID, Faculty> facultyMap = facultyRepository.findAll().stream()
                .collect(Collectors.toMap(Faculty::getId, Function.identity()));
        
        return users.stream()
                .map(user -> userMapper.toDto(user, facultyMap.get(user.getId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        log.info("Deleting user: id={}, email={}, role={}", user.getId(), user.getEmail(), user.getRole());
        
        // Remove Coordinator assignments linked to this user
        List<CoordinatorAssignment> coordAssignments = coordinatorAssignmentRepository.findByCoordinatorId(id);
        if (!coordAssignments.isEmpty()) {
            log.info("Removing {} coordinator assignments for user {}", coordAssignments.size(), id);
            coordinatorAssignmentRepository.deleteAll(coordAssignments);
        }
        
        // Unassign Faculty from any ClassSubjects
        List<ClassSubject> classSubjects = classSubjectRepository.findByFacultyId(id);
        if (!classSubjects.isEmpty()) {
            log.info("Unassigning {} class subjects from faculty {}", classSubjects.size(), id);
            for (ClassSubject cs : classSubjects) {
                cs.setFaculty(null);
            }
            classSubjectRepository.saveAll(classSubjects);
        }
        
        // Unassign Faculty from any TimetableSlots
        List<TimetableSlot> slots = timetableSlotRepository.findByFacultyId(id);
        if (!slots.isEmpty()) {
            log.info("Unassigning {} timetable slots from faculty {}", slots.size(), id);
            for (TimetableSlot ts : slots) {
                ts.setFaculty(null);
            }
            timetableSlotRepository.saveAll(slots);
        }
        
        // Delete Faculty record first if it exists (child of User via @MapsId)
        facultyRepository.findById(id).ifPresent(faculty -> {
            log.info("Deleting Faculty record: empId={}", faculty.getEmployeeId());
            facultyRepository.delete(faculty);
            facultyRepository.flush();
        });
        
        // Delete the User record
        userRepository.delete(user);
        log.info("User deleted successfully: id={}", id);
    }

    @Transactional
    public void deleteAllFaculty() {
        // Find all faculty and coordinators (exclude Admin/HOD to prevent lockout)
        List<User> faculties = userRepository.findByRoleIn(List.of(UserRole.FACULTY, UserRole.COORDINATOR));
        
        log.info("Initiating bulk delete for {} faculty/coordinator records", faculties.size());
        
        for (User user : faculties) {
            // Leverage the existing deleteUser logic to handle cascading safely
            deleteUser(user.getId());
        }
        
        log.info("Successfully deleted all faculty records.");
    }
}
