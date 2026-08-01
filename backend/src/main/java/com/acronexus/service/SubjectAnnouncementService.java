package com.acronexus.service;

import com.acronexus.dto.SubjectAnnouncementRequestDto;
import com.acronexus.dto.SubjectAnnouncementResponseDto;
import com.acronexus.security.UserDetailsImpl;

import java.util.List;
import java.util.UUID;

public interface SubjectAnnouncementService {
    List<SubjectAnnouncementResponseDto> getAnnouncementsForSubject(UUID classSubjectId, UserDetailsImpl userDetails);
    SubjectAnnouncementResponseDto createAnnouncement(UUID classSubjectId, SubjectAnnouncementRequestDto requestDto, UserDetailsImpl userDetails);
    void deleteAnnouncement(UUID announcementId, UserDetailsImpl userDetails);
}
