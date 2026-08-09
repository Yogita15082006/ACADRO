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

        if (request.getPaymentQrFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getPaymentQrFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment QR file not found"));
            event.setPaymentQrFile(file);
        }

        event = eventRepository.save(event);

        if (request.getTargets() != null && !request.getTargets().isEmpty()) {
            java.util.List<EventTargetAssignment> savedAssignments = new java.util.ArrayList<>();
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
                savedAssignments.add(targetAssignmentRepository.save(assignment));
            }
            event.setTargetAssignments(savedAssignments);
        }

        if (request.getAttendanceSessions() != null && !request.getAttendanceSessions().isEmpty()) {
            java.util.List<EventAttendanceSession> savedSessions = new java.util.ArrayList<>();
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
                savedSessions.add(attendanceSessionRepository.save(session));
            }
            event.setAttendanceSessions(savedSessions);
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

        if (request.getPaymentQrFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getPaymentQrFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment QR file not found"));
            event.setPaymentQrFile(file);
        } else {
            event.setPaymentQrFile(null);
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
    public ApiResponse<com.acronexus.dto.response.EventStatisticsDto> getEventStatistics(UUID currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        com.acronexus.dto.response.EventStatisticsDto.EventStatisticsDtoBuilder builder = 
                com.acronexus.dto.response.EventStatisticsDto.builder()
                .role(user.getRole().name());

        if (user.getRole() == UserRole.STUDENT) {
            Student student = studentRepository.findByUser_Id(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
            
            StudentEnrollment enrollment = studentEnrollmentRepository
                  .findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(user.getId())
                  .orElse(null);

            List<Event> availableEvents = java.util.Collections.emptyList();
            if (enrollment != null) {
                UUID deptId = student.getUser().getDepartment().getId();
                UUID classId = enrollment.getAcroClass().getId();
                Instant startOfDay = java.time.Instant.now().truncatedTo(java.time.temporal.ChronoUnit.DAYS);
                availableEvents = eventRepository.findAvailableEventsForStudent(deptId, classId, student.getBatchYear(), startOfDay);
            }
            
            List<EventRegistration> registrations = eventRegistrationRepository.findByStudentUserIdOrderByRegisteredAtDesc(user.getId());
            
            long attendedCount = registrations.stream()
                .filter(r -> "ATTENDED".equalsIgnoreCase(r.getAttendanceStatus()))
                .count();
                
            long missedCount = registrations.stream()
                .filter(r -> "MISSED".equalsIgnoreCase(r.getAttendanceStatus()))
                .count();

            builder.totalEvents((long) availableEvents.size())
                   .registeredEvents((long) registrations.size())
                   .attendedEvents(attendedCount)
                   .missedEvents(missedCount);
                   
        } else {
            Page<Event> allEventsPage = eventRepository.findAllByDepartmentId(user.getDepartment().getId(), Pageable.unpaged());
            List<Event> allEvents = allEventsPage.getContent();

            long upcoming = allEvents.stream().filter(e -> "UPCOMING".equalsIgnoreCase(e.getStatus())).count();
            long ongoing = allEvents.stream().filter(e -> "ONGOING".equalsIgnoreCase(e.getStatus())).count();
            long completed = allEvents.stream().filter(e -> "CLOSED".equalsIgnoreCase(e.getStatus()) || "COMPLETED".equalsIgnoreCase(e.getStatus())).count();

            builder.totalEvents((long) allEvents.size())
                   .upcomingEvents(upcoming)
                   .ongoingEvents(ongoing)
                   .completedEvents(completed);
        }

        return ApiResponse.success("Statistics fetched successfully", builder.build());
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

    private static final String UPLOAD_DIR = "uploads/events/";

    @Override
    @Transactional
    public UUID uploadBanner(org.springframework.web.multipart.MultipartFile file, UUID currentUserId) {
        try {
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(UPLOAD_DIR);
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = uploadPath.resolve(fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath);

            com.acronexus.entity.FileStorage fs = new com.acronexus.entity.FileStorage();
            fs.setFileName(file.getOriginalFilename());
            fs.setDocumentUrl(filePath.toString());
            fs.setFileType(file.getContentType());
            fs.setUploadedBy(userRepository.findById(currentUserId).orElse(null));
            fs.setUploadedAt(java.time.ZonedDateTime.now());
            fs.setIsActive(true);
            fs.setIsDeleted(false);
            fs = fileStorageRepository.save(fs);
            return fs.getId();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getBanner(UUID fileId) {
        com.acronexus.entity.FileStorage fs = fileStorageRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(fs.getDocumentUrl());
            return java.nio.file.Files.readAllBytes(path);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Error reading file", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.response.FileDownloadDto downloadFile(UUID fileId) {
        com.acronexus.entity.FileStorage fs = fileStorageRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(fs.getDocumentUrl());
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());
            if (resource.exists() || resource.isReadable()) {
                return com.acronexus.dto.response.FileDownloadDto.builder()
                        .resource(resource)
                        .fileName(fs.getFileName() != null ? fs.getFileName() : fs.getOriginalFilename())
                        .mimeType(fs.getFileType())
                        .build();
            } else {
                throw new RuntimeException("Could not read file!");
            }
        } catch (java.net.MalformedURLException e) {
            throw new RuntimeException("Error reading file", e);
        }
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
        
        Instant startOfDay = java.time.Instant.now().truncatedTo(java.time.temporal.ChronoUnit.DAYS);
        List<Event> availableEvents = eventRepository.findAvailableEventsForStudent(deptId, classId, student.getBatchYear(), startOfDay);
        
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
        if (event.getRegistrationEnd() != null && now.isAfter(event.getRegistrationEnd().plus(1, java.time.temporal.ChronoUnit.DAYS))) {
            throw new RuntimeException("Registration has closed");
        }
        if (event.getEventDate() != null && now.isAfter(event.getEventDate().plus(1, java.time.temporal.ChronoUnit.DAYS))) {
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
        if (event.getRegistrationEnd() != null && now.isAfter(event.getRegistrationEnd().plus(1, java.time.temporal.ChronoUnit.DAYS))) {
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

    private String normalizeYear(String year) {
        if (year.matches(".*1.*|.*First.*")) return "1st Year";
        if (year.matches(".*2.*|.*Second.*")) return "2nd Year";
        if (year.matches(".*3.*|.*Third.*")) return "3rd Year";
        if (year.matches(".*4.*|.*Fourth.*")) return "4th Year";
        return year;
    }

    private java.util.List<String> getYearVariations(String normalizedYear) {
        if (normalizedYear.equals("1st Year")) return java.util.Arrays.asList("1", "First Year", "First Year,First Year", "1st Year");
        if (normalizedYear.equals("2nd Year")) return java.util.Arrays.asList("2", "Second Year", "Second Year,Second Year", "2nd Year");
        if (normalizedYear.equals("3rd Year")) return java.util.Arrays.asList("3", "Third Year", "Third Year,Third Year", "3rd Year");
        if (normalizedYear.equals("4th Year")) return java.util.Arrays.asList("4", "Fourth Year", "Fourth Year,Fourth Year", "4th Year");
        return java.util.Arrays.asList(normalizedYear);
    }

    @Override
    public ApiResponse<List<String>> getAvailableYears(String batchYear) {
        List<String> rawYears = studentEnrollmentRepository.findDistinctAcademicYearsByBatch(batchYear);
        List<String> normalizedYears = rawYears.stream().map(this::normalizeYear).distinct().sorted().collect(java.util.stream.Collectors.toList());
        return ApiResponse.success("Years fetched", normalizedYears);
    }

    @Override
    public ApiResponse<List<String>> getAvailableSemesters(String batchYear, String academicYear) {
        java.util.List<String> yearVariations = getYearVariations(academicYear);
        return ApiResponse.success("Semesters fetched", studentEnrollmentRepository.findDistinctSemesters(batchYear, yearVariations)); // Requires new query
    }

    @Override
    public ApiResponse<List<com.acronexus.entity.AcroClass>> getAvailableClasses(String batchYear, String academicYear, String semester) {
        java.util.List<String> yearVariations = getYearVariations(academicYear);
        return ApiResponse.success("Classes fetched", studentEnrollmentRepository.findClasses(batchYear, yearVariations, semester)); // Requires new query
    }

    // --- AI Registration Form ---
    @Override
    public ApiResponse<com.acronexus.dto.response.EventParseResponseDto> parseEventText(com.acronexus.dto.request.EventParseRequestDto request) {
        String systemPrompt = "You are an AI that extracts event details from unstructured text and maps them to a strictly formatted JSON object. " +
                "You must NOT invent or guess any information. If a field is not explicitly mentioned or clearly implied, leave it as an empty string. " +
                "CRITICAL: For the 'description' field, you MUST include the COMPLETE ORIGINAL TEXT, preserving 100% of the pasted information, URLs, instructions, and details without summarizing or removing anything. " +
                "CRITICAL: If a registration URL is clearly provided, set 'registrationMethod' to 'Manually' and 'registrationExternalLink' to that exact URL. But still keep the URL in the 'description'. " +
                "Other URLs (website, social media) must ONLY go into 'description' and NOT 'registrationExternalLink'. " +
                "Output ONLY a single valid JSON object matching this exact structure, without any markdown formatting or backticks:\n" +
                "{\n" +
                "  \"title\": \"\",\n" +
                "  \"subtitle\": \"\",\n" +
                "  \"category\": \"\",\n" +
                "  \"description\": \"\",\n" +
                "  \"date\": \"\",\n" +
                "  \"startTime\": \"\",\n" +
                "  \"endTime\": \"\",\n" +
                "  \"mode\": \"\",\n" +
                "  \"venue\": \"\",\n" +
                "  \"locationLink\": \"\",\n" +
                "  \"meetingLink\": \"\",\n" +
                "  \"regStartDate\": \"\",\n" +
                "  \"regEndDate\": \"\",\n" +
                "  \"maxParticipants\": \"\",\n" +
                "  \"regFee\": \"\",\n" +
                "  \"isRegRequired\": \"\",\n" +
                "  \"registrationMethod\": \"\",\n" +
                "  \"registrationExternalLink\": \"\",\n" +
                "  \"allowWaitingList\": false,\n" +
                "  \"rulesAndGuidelines\": \"\"\n" +
                "}";

        com.acronexus.dto.ai.AiGenericRequest aiRequest = new com.acronexus.dto.ai.AiGenericRequest(systemPrompt, request.getText(), 0.3, 1000);
        com.acronexus.dto.ai.AiGenericResponse aiResponse = aiService.generateContent(aiRequest);

        if (aiResponse == null || aiResponse.getContent() == null) {
            throw new RuntimeException("Failed to generate response from AI Service");
        }

        String jsonContent = aiResponse.getContent().trim();
        if (jsonContent.startsWith("```json")) {
            jsonContent = jsonContent.substring(7);
        }
        if (jsonContent.startsWith("```")) {
            jsonContent = jsonContent.substring(3);
        }
        if (jsonContent.endsWith("```")) {
            jsonContent = jsonContent.substring(0, jsonContent.length() - 3);
        }
        jsonContent = jsonContent.trim();

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(jsonContent);
            while (root.isArray() && root.size() > 0) {
                root = root.get(0);
            }
            if (root.isArray()) {
                throw new RuntimeException("AI returned an empty array instead of object.");
            }
            com.acronexus.dto.response.EventParseResponseDto parsedEvent = mapper.treeToValue(root, com.acronexus.dto.response.EventParseResponseDto.class);
            return ApiResponse.success("Event details extracted successfully", parsedEvent);
        } catch (Exception e) {
            System.err.println("AI Response parsing failed. Content: " + jsonContent);
            throw new RuntimeException("Failed to parse AI response into Event structure: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> generateAiRegistrationForm(String prompt, UUID currentUserId) {
        String systemPrompt = "You are an AI that generates JSON configuration for event registration forms. The user will give you a description of the event or specific fields they want. Output ONLY a valid JSON array of objects. Ensure you generate EVERY single field the user explicitly asks for, exactly matching their requested fields. Do not omit any requested fields. Each object should have 'name', 'label', 'type' (e.g., text, email, number, select, date, textarea, checkbox), and 'required' (boolean). Do not wrap in markdown or backticks. Example: [{\"name\": \"teamName\", \"label\": \"Team Name\", \"type\": \"text\", \"required\": true}, {\"name\": \"dietaryRestrictions\", \"label\": \"Dietary Restrictions\", \"type\": \"textarea\", \"required\": false}]";
        com.acronexus.dto.ai.AiGenericRequest request = new com.acronexus.dto.ai.AiGenericRequest(systemPrompt, prompt, 0.7, 500);
        com.acronexus.dto.ai.AiGenericResponse response = aiService.generateContent(request);
        
        String jsonContent = response.getContent();
        if (jsonContent != null) {
            jsonContent = jsonContent.trim();
            if (jsonContent.startsWith("```json")) {
                jsonContent = jsonContent.substring(7);
            } else if (jsonContent.startsWith("```")) {
                jsonContent = jsonContent.substring(3);
            }
            if (jsonContent.endsWith("```")) {
                jsonContent = jsonContent.substring(0, jsonContent.length() - 3);
            }
            jsonContent = jsonContent.trim();
        }
        
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

    @Override
    public ApiResponse<List<com.acronexus.dto.response.EventNoticeResponse>> getEventNotices(UUID eventId, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        List<EventNotice> notices = noticeRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        List<com.acronexus.dto.response.EventNoticeResponse> responses = notices.stream().map(this::toNoticeResponse).collect(Collectors.toList());
        return ApiResponse.success("Notices fetched", responses);
    }

    // --- Attendance Management ---
    @Override
    public ApiResponse<List<com.acronexus.dto.response.EventAttendanceSessionResponse>> getAttendanceSessions(UUID eventId, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        List<EventAttendanceSession> sessions = attendanceSessionRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        List<com.acronexus.dto.response.EventAttendanceSessionResponse> responses = sessions.stream().map(session -> {
            com.acronexus.dto.response.EventAttendanceSessionResponse res = toSessionResponse(session);
            
            User user = userRepository.findById(currentUserId).orElse(null);
            if (user != null && "STUDENT".equals(user.getRole().name().toUpperCase())) {
                boolean isSubmitted = attendanceRecordRepository.findBySessionId(session.getId()).stream()
                    .anyMatch(r -> r.getStudent().getId().equals(currentUserId) && "SUBMITTED".equals(r.getStatus()));
                res.setIsSubmittedByCurrentUser(isSubmitted);
            }
            return res;
        }).collect(Collectors.toList());
        return ApiResponse.success("Sessions fetched", responses);
    }

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
    public ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> startAttendance(UUID eventId, com.acronexus.dto.request.StartEventAttendanceDto dto, UUID currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        checkEventManagementPermission(event, currentUserId);

        String code = dto.getAttendanceCode();
        if (code == null || code.trim().isEmpty()) {
            code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        EventAttendanceSession session = EventAttendanceSession.builder()
                .event(event)
                .halfType(dto.getHalfType())
                .selectedLectures(dto.getSelectedLectures())
                .timerDurationMinutes(dto.getTimerDurationMinutes())
                .uniqueCodeCount(dto.getUniqueCodeCount())
                .isIncludedInOverall(dto.getIsIncludedInOverall())
                .status("LIVE")
                .sessionStartTime(Instant.now())
                .attendanceCode(code)
                .build();
                
        session = attendanceSessionRepository.save(session);
        return ApiResponse.success("Attendance session started", toSessionResponse(session));
    }

    @Override
    @Transactional
    public ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> closeAttendance(UUID sessionId, UUID currentUserId) {
        EventAttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        checkEventManagementPermission(session.getEvent(), currentUserId);

        session.setStatus("CLOSED");
        session = attendanceSessionRepository.save(session);
        
        // Finalize pending students as NOT_SUBMITTED
        List<EventRegistration> registrations = eventRegistrationRepository.findByEventIdOrderByRegisteredAtDesc(session.getEvent().getId());
        List<EventAttendanceRecord> existingRecords = attendanceRecordRepository.findBySessionId(sessionId);
        java.util.Set<UUID> submittedStudentIds = existingRecords.stream().map(r -> r.getStudent().getId()).collect(Collectors.toSet());
        
        for (EventRegistration reg : registrations) {
            if (!submittedStudentIds.contains(reg.getStudent().getId())) {
                EventAttendanceRecord notSubmitted = EventAttendanceRecord.builder()
                        .session(session)
                        .student(reg.getStudent())
                        .status("NOT_SUBMITTED")
                        .build();
                attendanceRecordRepository.save(notSubmitted);
            }
        }
        
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

        if (!"LIVE".equals(session.getStatus())) {
            throw new RuntimeException("Attendance is not LIVE");
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
    
    @Override
    public ApiResponse<com.acronexus.dto.response.EventAttendanceSessionDetailsResponse> getSessionRecordsWithStats(UUID sessionId, UUID currentUserId) {
        EventAttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        checkEventManagementPermission(session.getEvent(), currentUserId);

        List<EventRegistration> registrations = eventRegistrationRepository.findByEventIdOrderByRegisteredAtDesc(session.getEvent().getId());
        List<EventAttendanceRecord> records = attendanceRecordRepository.findBySessionId(sessionId);

        java.util.Map<UUID, EventAttendanceRecord> recordMap = records.stream()
                .collect(Collectors.toMap(r -> r.getStudent().getId(), r -> r));

        int totalRegistered = registrations.size();
        int submitted = 0;
        int notSubmitted = 0;
        int absent = 0;
        int pending = 0;

        List<com.acronexus.dto.response.EventAttendanceRecordResponse> recordResponses = new java.util.ArrayList<>();

        for (EventRegistration reg : registrations) {
            Student student = reg.getStudent();
            EventAttendanceRecord rec = recordMap.get(student.getId());
            String status = "PENDING";
            Integer uniqueCode = null;
            Instant submittedAt = null;

            if (rec != null) {
                status = rec.getStatus();
                uniqueCode = rec.getUniqueCodeUsed();
                submittedAt = rec.getSubmittedAt();
                
                if ("SUBMITTED".equals(status)) submitted++;
                else if ("NOT_SUBMITTED".equals(status)) notSubmitted++;
                else if ("ABSENT".equals(status)) absent++;
            } else {
                pending++;
            }
            
            String batch = student.getBatchYear() != null ? student.getBatchYear() : "N/A";
            String semester = student.getCurrentSemester() != null ? student.getCurrentSemester().toString() : "N/A";
            String className = "N/A";
            
            java.util.Optional<StudentEnrollment> enrollment = studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(student.getUser().getId());
            if (enrollment.isPresent() && enrollment.get().getAcroClass() != null) {
                className = enrollment.get().getAcroClass().getName();
                if (enrollment.get().getAcroClass().getSection() != null) {
                    className += "-" + enrollment.get().getAcroClass().getSection();
                }
            }

            recordResponses.add(com.acronexus.dto.response.EventAttendanceRecordResponse.builder()
                    .studentId(student.getId())
                    .studentName(student.getUser().getFirstName() + " " + student.getUser().getLastName())
                    .enrollmentNo(student.getEnrollmentNo())
                    .batchYear(batch)
                    .semester(semester)
                    .className(className)
                    .uniqueCodeUsed(uniqueCode)
                    .submittedAt(submittedAt)
                    .status(status)
                    .build());
        }
        
        com.acronexus.dto.response.EventAttendanceSessionDetailsResponse responseDto = com.acronexus.dto.response.EventAttendanceSessionDetailsResponse.builder()
                .totalRegistered(totalRegistered)
                .submitted(submitted)
                .pending(pending)
                .notSubmitted(notSubmitted)
                .absent(absent)
                .records(recordResponses)
                .build();

        return ApiResponse.success("Session stats and records fetched", responseDto);
    }
    
    private com.acronexus.dto.response.EventNoticeResponse toNoticeResponse(EventNotice notice) {
        return com.acronexus.dto.response.EventNoticeResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .description(notice.getDescription())
                .attachmentFileId(notice.getAttachmentFile() != null ? notice.getAttachmentFile().getId() : null)
                .attachmentFileUrl(notice.getAttachmentFile() != null ? "/api/events/file/" + notice.getAttachmentFile().getId() : null)
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

