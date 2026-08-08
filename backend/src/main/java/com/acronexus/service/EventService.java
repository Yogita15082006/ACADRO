package com.acronexus.service;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.request.EventRequest;
import com.acronexus.dto.response.EventRegistrationResponse;
import com.acronexus.dto.response.EventResponse;
import com.acronexus.dto.response.ParticipantExportDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface EventService {
    ApiResponse<EventResponse> createEvent(EventRequest request, UUID currentUserId);
    ApiResponse<EventResponse> updateEvent(UUID eventId, EventRequest request, UUID currentUserId);
    ApiResponse<Void> deleteEvent(UUID eventId, UUID currentUserId);
    ApiResponse<EventResponse> toggleEventPublishStatus(UUID eventId, boolean isActive, UUID currentUserId);
    
    ApiResponse<Page<EventResponse>> getAllEvents(Pageable pageable, UUID currentUserId);
    ApiResponse<EventResponse> getEventById(UUID eventId, UUID currentUserId);
    
    ApiResponse<List<EventResponse>> getAvailableEventsForStudent(UUID studentUserId);
    ApiResponse<List<EventRegistrationResponse>> getStudentRegistrations(UUID studentUserId);
    
    ApiResponse<EventRegistrationResponse> registerForEvent(UUID eventId, com.acronexus.dto.request.EventRegistrationRequest request, UUID studentUserId);
    ApiResponse<Void> cancelRegistration(UUID eventId, UUID studentUserId);
    
    ApiResponse<Page<EventRegistrationResponse>> getEventRegistrations(UUID eventId, Pageable pageable, UUID currentUserId);
    ApiResponse<List<ParticipantExportDto>> exportParticipantList(UUID eventId, UUID currentUserId);

    // Metadata
    ApiResponse<List<String>> getAvailableBatches();
    ApiResponse<List<String>> getAvailableYears(String batchYear);
    ApiResponse<List<String>> getAvailableSemesters(String batchYear, String academicYear);
    ApiResponse<List<com.acronexus.entity.AcroClass>> getAvailableClasses(String batchYear, String academicYear, String semester);

    // AI Form Configuration
    ApiResponse<String> generateAiRegistrationForm(String prompt, UUID currentUserId);

    // Notices
    ApiResponse<com.acronexus.dto.response.EventNoticeResponse> publishNotice(UUID eventId, com.acronexus.dto.request.EventNoticeRequest request, UUID currentUserId);
    ApiResponse<com.acronexus.dto.response.EventNoticeResponse> updateNotice(UUID noticeId, com.acronexus.dto.request.EventNoticeRequest request, UUID currentUserId);
    ApiResponse<Void> deleteNotice(UUID noticeId, UUID currentUserId);
    
    // Attendance
    ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> generateAttendanceCode(UUID sessionId, UUID currentUserId);
    ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> startAttendance(UUID sessionId, UUID currentUserId);
    ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> closeAttendance(UUID sessionId, UUID currentUserId);
    ApiResponse<com.acronexus.dto.response.EventAttendanceSessionResponse> updateUniqueCodeCount(UUID sessionId, Integer count, UUID currentUserId);
    ApiResponse<Void> submitAttendance(UUID sessionId, String attendanceCode, Integer uniqueCode, UUID studentUserId);
}
