package com.acronexus.mapper;

import com.acronexus.dto.request.EventRequest;
import com.acronexus.dto.response.EventRegistrationResponse;
import com.acronexus.dto.response.EventResponse;
import com.acronexus.entity.Event;
import com.acronexus.entity.EventRegistration;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {

    public Event toEntity(EventRequest request) {
        return Event.builder()
                .title(request.getTitle())
                .category(request.getCategory())
                .description(request.getDescription())
                .venue(request.getVenue())
                .eventDate(request.getEventDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .mode(request.getMode())
                .locationLink(request.getLocationLink())
                .registrationStart(request.getRegistrationStart())
                .registrationEnd(request.getRegistrationEnd())
                .maxParticipants(request.getMaxParticipants())
                .registrationFee(request.getRegistrationFee())
                .allowWaitingList(request.getAllowWaitingList() != null ? request.getAllowWaitingList() : false)
                .registrationMethod(request.getRegistrationMethod())
                .registrationExternalLink(request.getRegistrationExternalLink())
                .aiRegistrationFormConfig(request.getAiRegistrationFormConfig())
                .rulesAndGuidelines(request.getRulesAndGuidelines())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .includeInOverallAttendance(request.getIsAttendanceEnabled() != null ? request.getIsAttendanceEnabled() : false)
                .build();
    }

    public void updateEntity(Event event, EventRequest request) {
        event.setTitle(request.getTitle());
        event.setCategory(request.getCategory());
        event.setDescription(request.getDescription());
        event.setVenue(request.getVenue());
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setMode(request.getMode());
        event.setLocationLink(request.getLocationLink());
        event.setRegistrationStart(request.getRegistrationStart());
        event.setRegistrationEnd(request.getRegistrationEnd());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setRegistrationFee(request.getRegistrationFee());
        if (request.getAllowWaitingList() != null) event.setAllowWaitingList(request.getAllowWaitingList());
        event.setRegistrationMethod(request.getRegistrationMethod());
        event.setRegistrationExternalLink(request.getRegistrationExternalLink());
        event.setAiRegistrationFormConfig(request.getAiRegistrationFormConfig());
        event.setRulesAndGuidelines(request.getRulesAndGuidelines());
        if (request.getIsActive() != null) {
            event.setIsActive(request.getIsActive());
        }
        if (request.getIsAttendanceEnabled() != null) {
            event.setIncludeInOverallAttendance(request.getIsAttendanceEnabled());
        }
    }

    public EventResponse toResponse(Event event, long currentParticipants, boolean isRegistered) {
        java.util.List<com.acronexus.dto.request.EventTargetAssignmentDto> mappedTargets = null;
        if (event.getTargetAssignments() != null) {
            mappedTargets = event.getTargetAssignments().stream().map(t -> {
                com.acronexus.dto.request.EventTargetAssignmentDto dto = new com.acronexus.dto.request.EventTargetAssignmentDto();
                dto.setBatchYear(t.getBatchYear());
                dto.setAcademicYear(t.getAcademicYear());
                dto.setSemester(t.getSemester());
                dto.setIsEntireBatch(t.getIsEntireBatch());
                if (t.getAcroClass() != null) {
                    dto.setAcroClassId(t.getAcroClass().getId());
                    dto.setAcroClassName(t.getAcroClass().getName());
                }
                return dto;
            }).collect(java.util.stream.Collectors.toList());
        }

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .category(event.getCategory())
                .description(event.getDescription())
                .venue(event.getVenue())
                .eventDate(event.getEventDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .mode(event.getMode())
                .locationLink(event.getLocationLink())
                .registrationStart(event.getRegistrationStart())
                .registrationEnd(event.getRegistrationEnd())
                .maxParticipants(event.getMaxParticipants())
                .registrationFee(event.getRegistrationFee())
                .allowWaitingList(event.getAllowWaitingList())
                .registrationMethod(event.getRegistrationMethod())
                .registrationExternalLink(event.getRegistrationExternalLink())
                .aiRegistrationFormConfig(event.getAiRegistrationFormConfig())
                .rulesAndGuidelines(event.getRulesAndGuidelines())
                .currentParticipants(currentParticipants)
                .isRegistered(isRegistered)
                .isRegRequired(event.getRegistrationStart() != null || event.getRegistrationMethod() != null)
                .departmentId(event.getDepartment() != null ? event.getDepartment().getId() : null)
                .departmentName(event.getDepartment() != null ? event.getDepartment().getName() : null)
                .targetClassId(event.getTargetClass() != null ? event.getTargetClass().getId() : null)
                .targetClassName(event.getTargetClass() != null ? event.getTargetClass().getName() : null)
                .isAttendanceConfigured(event.getAttendanceSessions() != null && !event.getAttendanceSessions().isEmpty())
                .posterFileUrl(event.getPosterFile() != null ? "/api/events/banner/" + event.getPosterFile().getId() : null)
                .paymentQrFileUrl(event.getPaymentQrFile() != null ? "/api/events/banner/" + event.getPaymentQrFile().getId() : null)
                .isActive(event.getIsActive())
                .includeInOverallAttendance(event.getIncludeInOverallAttendance())
                .status(event.getStatus())
                .creatorName(event.getCreatedBy() != null ? event.getCreatedBy().getFirstName() + " " + event.getCreatedBy().getLastName() : null)
                .createdDate(event.getCreatedAt())
                .targets(mappedTargets)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    public EventRegistrationResponse toRegistrationResponse(EventRegistration registration) {
        return EventRegistrationResponse.builder()
                .id(registration.getId())
                .eventId(registration.getEvent().getId())
                .eventTitle(registration.getEvent().getTitle())
                .studentId(registration.getStudent().getUser().getId())
                .studentName(registration.getStudent().getUser().getFirstName() + " " + registration.getStudent().getUser().getLastName())
                .enrollmentNo(registration.getStudent().getEnrollmentNo())
                .className(registration.getStudent().getSection() != null ? registration.getStudent().getSection() : registration.getStudent().getCourse())
                .batchYear(registration.getStudent().getBatchYear())
                .currentYear(registration.getStudent().getAdmissionYear())
                .semester(registration.getStudent().getCurrentSemester())
                .email(registration.getStudent().getUser().getEmail())
                .phoneNumber(registration.getStudent().getUser().getPhone())
                .registeredAt(registration.getRegisteredAt())
                .attendanceStatus(registration.getAttendanceStatus())
                .certificateGenerated(registration.getCertificateGenerated())
                .customFormResponses(registration.getCustomFormResponses())
                .build();
    }
}
