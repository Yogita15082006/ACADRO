package com.acronexus.service.impl;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.request.EventRequest;
import com.acronexus.dto.response.EventRegistrationResponse;
import com.acronexus.dto.response.EventResponse;
import com.acronexus.dto.response.ParticipantExportDto;
import com.acronexus.entity.*;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.EventMapper;
import com.acronexus.repository.*;
import com.acronexus.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final DepartmentRepository departmentRepository;
    private final AcroClassRepository acroClassRepository;
    private final FileStorageRepository fileStorageRepository;
    private final EventTargetAssignmentRepository targetAssignmentRepository;
    private final EventAttendanceSessionRepository attendanceSessionRepository;
    private final EventAttendanceRecordRepository attendanceRecordRepository;
    private final EventNoticeRepository noticeRepository;
    private final EventMapper eventMapper;
    private final com.acronexus.service.AiService aiService;

    @Override
    @Transactional
    public ApiResponse<EventResponse> createEvent(EventRequest request, UUID currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == UserRole.STUDENT) {
            throw new RuntimeException("Students cannot create events");
        }

        Event event = eventMapper.toEntity(request);
        event.setCreatedBy(user);

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
            event.setDepartment(dept);
        } else if (user.getRole() == UserRole.FACULTY || user.getRole() == UserRole.HOD) {
            event.setDepartment(user.getDepartment());
        }

        if (request.getTargetClassId() != null) {
            AcroClass acroClass = acroClassRepository.findById(request.getTargetClassId())
                    .orElseThrow(() -> new ResourceNotFoundException("Target class not found"));
            event.setTargetClass(acroClass);
        }

        if (request.getPosterFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getPosterFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Poster file not found"));
            event.setPosterFile(file);
        }

        event = eventRepository.save(event);

        if (request.getTargets() != null && !request.getTargets().isEmpty()) {
            for (com.acronexus.dto.request.EventTargetAssignmentDto dto : request.getTargets()) {
                EventTargetAssignment assignment = EventTargetAssignment.builder()
                        .event(event)
                        .batchYear(dto.getBatchYear())
                        .academicYear(dto.getAcademicYear())
                        .semester(dto.getSemester())
                        .isEntireBatch(dto.getIsEntireBatch() != null ? dto.getIsEntireBatch() : false)
                        .build();
                if (dto.getAcroClassId() != null) {
                    assignment.setAcroClass(acroClassRepository.findById(dto.getAcroClassId()).orElse(null));
                }
                targetAssignmentRepository.save(assignment);
            }
        }

        if (request.getAttendanceSessions() != null && !request.getAttendanceSessions().isEmpty()) {
            for (com.acronexus.dto.request.EventAttendanceSessionDto dto : request.getAttendanceSessions()) {
                EventAttendanceSession session = EventAttendanceSession.builder()
                        .event(event)
                        .halfType(dto.getHalfType())
                        .selectedLectures(dto.getSelectedLectures())
                        .timerDurationMinutes(dto.getTimerDurationMinutes())
                        .uniqueCodeCount(dto.getUniqueCodeCount())
                        .isIncludedInOverall(dto.getIsIncludedInOverall() != null ? dto.getIsIncludedInOverall() : false)
                        .status("NOT_STARTED")
                        .build();
                attendanceSessionRepository.save(session);
            }
        }

        return ApiResponse.success("Event created successfully", eventMapper.toResponse(event, 0L, false));
    }

    @Override
    @Transactional
    public ApiResponse<EventResponse> updateEvent(UUID eventId, EventRequest request, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
                
        checkEventManagementPermission(event, currentUserId);

        eventMapper.updateEntity(event, request);

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
            event.setDepartment(dept);
        } else {
            event.setDepartment(null);
        }

        if (request.getTargetClassId() != null) {
            AcroClass acroClass = acroClassRepository.findById(request.getTargetClassId())
                    .orElseThrow(() -> new ResourceNotFoundException("Target class not found"));
            event.setTargetClass(acroClass);
        } else {
            event.setTargetClass(null);
        }

        if (request.getPosterFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getPosterFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Poster file not found"));
            event.setPosterFile(file);
        } else {
            event.setPosterFile(null);
        }

        event = eventRepository.save(event);
        long currentParticipants = eventRegistrationRepository.countByEventId(eventId);
        return ApiResponse.success("Event updated successfully", eventMapper.toResponse(event, currentParticipants, false));
    }

    @Override
    @Transactional
    public ApiResponse<Void> deleteEvent(UUID eventId, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        checkEventManagementPermission(event, currentUserId);
        eventRepository.delete(event);
        return ApiResponse.success("Event deleted successfully", null);
    }

    @Override
    @Transactional
    public ApiResponse<EventResponse> toggleEventPublishStatus(UUID eventId, boolean isActive, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        checkEventManagementPermission(event, currentUserId);
        event.setIsActive(isActive);
        event = eventRepository.save(event);
        long currentParticipants = eventRegistrationRepository.countByEventId(eventId);
        return ApiResponse.success("Event status updated", eventMapper.toResponse(event, currentParticipants, false));
    }

    @Override
    public ApiResponse<Page<EventResponse>> getAllEvents(Pageable pageable, UUID currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        Page<Event> events = eventRepository.findAllByDepartmentId(user.getDepartment().getId(), pageable);
        
        Page<EventResponse> responsePage = events.map(e -> {
            long count = eventRegistrationRepository.countByEventId(e.getId());
            return eventMapper.toResponse(e, count, false);
        });
        
        return ApiResponse.success("Events fetched successfully", responsePage);
    }

    @Override
    public ApiResponse<EventResponse> getEventById(UUID eventId, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        long count = eventRegistrationRepository.countByEventId(eventId);
        boolean isRegistered = false;
        
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == UserRole.STUDENT) {
            isRegistered = eventRegistrationRepository.existsByEventIdAndStudentUserId(eventId, currentUserId);
        }
        
        return ApiResponse.success("Event fetched successfully", eventMapper.toResponse(event, count, isRegistered));
    }

    @Override
    public ApiResponse<List<EventResponse>> getAvailableEventsForStudent(UUID studentUserId) {
        Student student = studentRepository.findByUser_Id(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
                
        StudentEnrollment enrollment = studentEnrollmentRepository
                .findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("No active enrollment found"));
                
        UUID deptId = student.getUser().getDepartment().getId();
        UUID classId = enrollment.getAcroClass().getId();
        
        List<Event> availableEvents = eventRepository.findAvailableEventsForStudent(deptId, classId, student.getBatchYear(), Instant.now());
        
        List<EventResponse> responses = availableEvents.stream().map(e -> {
            long count = eventRegistrationRepository.countByEventId(e.getId());
            boolean isRegistered = eventRegistrationRepository.existsByEventIdAndStudentUserId(e.getId(), studentUserId);
            return eventMapper.toResponse(e, count, isRegistered);
        }).collect(Collectors.toList());
        
        return ApiResponse.success("Available events fetched", responses);
    }

    @Override
    public ApiResponse<List<EventRegistrationResponse>> getStudentRegistrations(UUID studentUserId) {
        List<EventRegistration> registrations = eventRegistrationRepository.findByStudentUserIdOrderByRegisteredAtDesc(studentUserId);
        List<EventRegistrationResponse> responses = registrations.stream()
                .map(eventMapper::toRegistrationResponse)
                .collect(Collectors.toList());
        return ApiResponse.success("Registrations fetched", responses);
    }

    @Override
    @Transactional
    public ApiResponse<EventRegistrationResponse> registerForEvent(UUID eventId, com.acronexus.dto.request.EventRegistrationRequest request, UUID studentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
                
        if (!event.getIsActive()) {
            throw new RuntimeException("Event is not active");
        }
        
        Instant now = Instant.now();
        if (event.getRegistrationStart() != null && now.isBefore(event.getRegistrationStart())) {
            throw new RuntimeException("Registration has not started yet");
        }
        if (event.getRegistrationEnd() != null && now.isAfter(event.getRegistrationEnd())) {
            throw new RuntimeException("Registration has closed");
        }
        if (event.getEventDate() != null && now.isAfter(event.getEventDate())) {
            throw new RuntimeException("Cannot register after event date");
        }
        
        if (eventRegistrationRepository.existsByEventIdAndStudentUserId(eventId, studentUserId)) {
            throw new RuntimeException("Student is already registered for this event");
        }
        
        if (event.getMaxParticipants() != null) {
            long currentParticipants = eventRegistrationRepository.countByEventId(eventId);
            if (currentParticipants >= event.getMaxParticipants()) {
                throw new RuntimeException("Event has reached maximum participant capacity");
            }
        }
        
        Student student = studentRepository.findByUser_Id(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
                
        EventRegistration registration = EventRegistration.builder()
                .event(event)
                .student(student)
                .customFormResponses(request != null ? request.getCustomFormResponses() : null)
                .build();
                
        registration = eventRegistrationRepository.save(registration);
        return ApiResponse.success("Successfully registered for event", eventMapper.toRegistrationResponse(registration));
    }

    @Override
    @Transactional
    public ApiResponse<Void> cancelRegistration(UUID eventId, UUID studentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
                
        Instant now = Instant.now();
        if (event.getRegistrationEnd() != null && now.isAfter(event.getRegistrationEnd())) {
            throw new RuntimeException("Cannot cancel registration after registration has closed");
        }
        
        EventRegistration registration = eventRegistrationRepository.findByEventIdAndStudentUserId(eventId, studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));
                
        eventRegistrationRepository.delete(registration);
        return ApiResponse.success("Registration cancelled successfully", null);
    }

    @Override
    public ApiResponse<Page<EventRegistrationResponse>> getEventRegistrations(UUID eventId, Pageable pageable, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        checkEventManagementPermission(event, currentUserId);
        
        Page<EventRegistration> registrations = eventRegistrationRepository.findByEventId(eventId, pageable);
        Page<EventRegistrationResponse> responses = registrations.map(eventMapper::toRegistrationResponse);
        return ApiResponse.success("Registrations fetched", responses);
    }

    @Override
    public ApiResponse<List<ParticipantExportDto>> exportParticipantList(UUID eventId, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        checkEventManagementPermission(event, currentUserId);
        
        List<EventRegistration> registrations = eventRegistrationRepository.findByEventIdOrderByRegisteredAtDesc(eventId);
        List<ParticipantExportDto> dtos = registrations.stream().map(r -> ParticipantExportDto.builder()
                .enrollmentNo(r.getStudent().getEnrollmentNo())
                .studentName(r.getStudent().getUser().getFirstName() + " " + r.getStudent().getUser().getLastName())
                .studentEmail(r.getStudent().getUser().getEmail())
                .registeredAt(r.getRegisteredAt())
                .attendanceStatus(r.getAttendanceStatus())
                .build()
        ).collect(Collectors.toList());
        
        return ApiResponse.success("Export data generated", dtos);
    }
    
    private void checkEventManagementPermission(Event event, UUID currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        if (user.getRole() == UserRole.STUDENT) {
            throw new RuntimeException("Access denied");
        }
        
        if (event.getDepartment() != null && !event.getDepartment().getId().equals(user.getDepartment().getId())) {
            throw new RuntimeException("Cannot manage events of another department");
        }
    }

    // --- Metadata Methods ---
    @Override
    public ApiResponse<List<String>> getAvailableBatches() {
        return ApiResponse.success("Batches fetched", studentRepository.findDistinctBatchYears());
    }

    @Override
    public ApiResponse<List<String>> getAvailableYears(String batchYear) {
        return ApiResponse.success("Years fetched", studentEnrollmentRepository.findDistinctAcademicYearsByBatch(batchYear)); // Requires new query
    }

    @Override
    public ApiResponse<List<String>> getAvailableSemesters(String batchYear, String academicYear) {
        return ApiResponse.success("Semesters fetched", studentEnrollmentRepository.findDistinctSemesters(batchYear, academicYear)); // Requires new query
    }

    @Override
    public ApiResponse<List<com.acronexus.entity.AcroClass>> getAvailableClasses(String batchYear, String academicYear, String semester) {
        return ApiResponse.success("Classes fetched", studentEnrollmentRepository.findClasses(batchYear, academicYear, semester)); // Requires new query
    }

    // --- AI Registration Form ---
    @Override
    public ApiResponse<String> generateAiRegistrationForm(String prompt, UUID currentUserId) {
        String systemPrompt = "You are an AI that generates JSON configuration for event registration forms. The user will give you a description of the event or fields they want. Output ONLY a valid JSON array of objects. Each object should have 'name', 'label', 'type' (e.g., text, email, number, select, date), and 'required' (boolean). Do not wrap in markdown or backticks. Example: [{\"name\": \"fullName\", \"label\": \"Full Name\", \"type\": \"text\", \"required\": true}]";
        com.acronexus.dto.ai.AiGenericRequest request = new com.acronexus.dto.ai.AiGenericRequest(systemPrompt, prompt, 0.7, 500);
        com.acronexus.dto.ai.AiGenericResponse response = aiService.generateContent(request);
        
        String jsonContent = response.getContent();
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(jsonContent);
            if (!root.isArray()) {
                throw new RuntimeException("AI response is not a valid JSON array");
            }
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("AI returned invalid JSON: " + jsonContent);
        }
        
        return ApiResponse.success("AI form generated successfully", jsonContent);
    }

    // --- Notices ---
    @Override
    @Transactional
    public ApiResponse<com.acronexus.dto.response.EventNoticeResponse> publishNotice(UUID eventId, com.acronexus.dto.request.EventNoticeRequest request, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        checkEventManagementPermission(event, currentUserId);

        EventNotice notice = EventNotice.builder()
                .event(event)
                .title(request.getTitle())
                .description(request.getDescription())
                .build();
                
        if (request.getAttachmentFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getAttachmentFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("File not found"));
            notice.setAttachmentFile(file);
        }

        notice = noticeRepository.save(notice);
        return ApiResponse.success("Notice published", toNoticeResponse(notice));
    }

    @Override
    @Transactional
    public ApiResponse<com.acronexus.dto.response.EventNoticeResponse> updateNotice(UUID noticeId, com.acronexus.dto.request.EventNoticeRequest request, UUID currentUserId) {
        EventNotice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));
        checkEventManagementPermission(notice.getEvent(), currentUserId);

        notice.setTitle(request.getTitle());
        notice.setDescription(request.getDescription());
        
        if (request.getAttachmentFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getAttachmentFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("File not found"));
            notice.setAttachmentFile(file);
        } else {
            notice.setAttachmentFile(null);
        }

        notice = noticeRepository.save(notice);
        return ApiResponse.success("Notice updated", toNoticeResponse(notice));
    }

    @Override
    @Transactional
    public ApiResponse<Void> deleteNotice(UUID noticeId, UUID currentUserId) {
        EventNotice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));
        checkEventManagementPermission(notice.getEvent(), currentUserId);
        noticeRepository.delete(notice);
        return ApiResponse.success("Notice deleted", null);
    }

    // --- Attendance Management ---
    @Override
    @Transactional
    public ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> generateAttendanceCode(UUID sessionId, UUID currentUserId) {
        EventAttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        checkEventManagementPermission(session.getEvent(), currentUserId);

        String newCode = java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        session.setAttendanceCode(newCode);
        session = attendanceSessionRepository.save(session);
        return ApiResponse.success("Attendance code generated", toSessionResponse(session));
    }

    @Override
    @Transactional
    public ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> startAttendance(UUID sessionId, UUID currentUserId) {
        EventAttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        checkEventManagementPermission(session.getEvent(), currentUserId);

        if (session.getUniqueCodeCount() == null || session.getUniqueCodeCount() <= 0) {
            throw new RuntimeException("Unique code count must be configured before starting attendance");
        }
        if (session.getAttendanceCode() == null || session.getAttendanceCode().isEmpty()) {
            throw new RuntimeException("Attendance code must be generated before starting attendance");
        }

        session.setStatus("OPEN");
        session.setSessionStartTime(Instant.now());
        session = attendanceSessionRepository.save(session);
        return ApiResponse.success("Attendance started", toSessionResponse(session));
    }

    @Override
    @Transactional
    public ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> closeAttendance(UUID sessionId, UUID currentUserId) {
        EventAttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        checkEventManagementPermission(session.getEvent(), currentUserId);

        session.setStatus("CLOSED");
        session = attendanceSessionRepository.save(session);
        return ApiResponse.success("Attendance closed", toSessionResponse(session));
    }

    @Override
    @Transactional
    public ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> updateUniqueCodeCount(UUID sessionId, Integer count, UUID currentUserId) {
        EventAttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        checkEventManagementPermission(session.getEvent(), currentUserId);

        session.setUniqueCodeCount(count);
        session = attendanceSessionRepository.save(session);
        return ApiResponse.success("Unique code count updated", toSessionResponse(session));
    }

    @Override
    @Transactional
    public ApiResponse<Void> submitAttendance(UUID sessionId, String attendanceCode, Integer uniqueCode, UUID studentUserId) {
        EventAttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!"OPEN".equals(session.getStatus())) {
            throw new RuntimeException("Attendance is not open");
        }
        
        if (session.getTimerDurationMinutes() != null && session.getSessionStartTime() != null) {
            Instant expiryTime = session.getSessionStartTime().plusSeconds(session.getTimerDurationMinutes() * 60L);
            if (Instant.now().isAfter(expiryTime)) {
                session.setStatus("CLOSED");
                attendanceSessionRepository.save(session);
                throw new RuntimeException("Attendance timer has expired");
            }
        }

        if (!session.getAttendanceCode().equals(attendanceCode)) {
            throw new RuntimeException("Invalid attendance code");
        }

        if (uniqueCode < 1 || uniqueCode > session.getUniqueCodeCount()) {
            throw new RuntimeException("Invalid unique code range");
        }

        Student student = studentRepository.findByUser_Id(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!eventRegistrationRepository.existsByEventIdAndStudentUserId(session.getEvent().getId(), studentUserId)) {
            throw new RuntimeException("You are not registered for this event");
        }

        if (attendanceRecordRepository.existsBySessionIdAndStudentId(sessionId, studentUserId)) {
            throw new RuntimeException("You have already submitted attendance");
        }

        // Duplicate code check - mark both absent if duplicate exists
        boolean codeAlreadyUsed = attendanceRecordRepository.existsBySessionIdAndUniqueCodeUsed(sessionId, uniqueCode);
        
        if (codeAlreadyUsed) {
            // Find existing record and mark it absent
            List<EventAttendanceRecord> existingRecords = attendanceRecordRepository.findBySessionId(sessionId).stream()
                .filter(r -> r.getUniqueCodeUsed() != null && r.getUniqueCodeUsed().equals(uniqueCode))
                .collect(Collectors.toList());
            
            for (EventAttendanceRecord rec : existingRecords) {
                rec.setStatus("ABSENT");
                attendanceRecordRepository.save(rec);
            }

            // Save current student as absent
            EventAttendanceRecord newRecord = EventAttendanceRecord.builder()
                    .session(session)
                    .student(student)
                    .uniqueCodeUsed(uniqueCode)
                    .submittedAt(Instant.now())
                    .status("ABSENT")
                    .build();
            attendanceRecordRepository.save(newRecord);
            throw new RuntimeException("Duplicate code detected. Attendance marked as absent.");
        }

        EventAttendanceRecord record = EventAttendanceRecord.builder()
                .session(session)
                .student(student)
                .uniqueCodeUsed(uniqueCode)
                .submittedAt(Instant.now())
                .status("SUBMITTED")
                .build();
        attendanceRecordRepository.save(record);

        return ApiResponse.success("Attendance submitted successfully", null);
    }
    
    private com.acronexus.dto.response.EventNoticeResponse toNoticeResponse(EventNotice notice) {
        return com.acronexus.dto.response.EventNoticeResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .description(notice.getDescription())
                .attachmentFileId(notice.getAttachmentFile() != null ? notice.getAttachmentFile().getId() : null)
                .attachmentFileUrl(notice.getAttachmentFile() != null ? notice.getAttachmentFile().getDocumentUrl() : null)
                .createdAt(notice.getCreatedAt() != null ? notice.getCreatedAt().toInstant() : null)
                .build();
    }
    
    private com.acronexus.dto.response.EventAttendanceSessionResponse toSessionResponse(EventAttendanceSession session) {
        return com.acronexus.dto.response.EventAttendanceSessionResponse.builder()
                .id(session.getId())
                .halfType(session.getHalfType())
                .selectedLectures(session.getSelectedLectures())
                .status(session.getStatus())
                .attendanceCode(session.getAttendanceCode())
                .timerDurationMinutes(session.getTimerDurationMinutes())
                .sessionStartTime(session.getSessionStartTime())
                .uniqueCodeCount(session.getUniqueCodeCount())
                .isIncludedInOverall(session.getIsIncludedInOverall())
                .build();
    }


}

