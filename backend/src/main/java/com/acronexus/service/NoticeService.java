package com.acronexus.service;

import com.acronexus.dto.NoticeDto;
import com.acronexus.dto.NoticeRequest;
import com.acronexus.dto.NoticeSearchFilter;

import java.util.List;
import java.util.UUID;

public interface NoticeService {
    NoticeDto createNotice(NoticeRequest request, UUID userId);
    NoticeDto updateNotice(UUID noticeId, NoticeRequest request, UUID userId);
    void deleteNotice(UUID noticeId, UUID userId);
    NoticeDto publishNotice(UUID noticeId, UUID userId);
    NoticeDto unpublishNotice(UUID noticeId, UUID userId);
    List<NoticeDto> getStudentNotices(UUID studentId);
    NoticeDto getNoticeDetails(UUID noticeId, UUID userId);
    List<NoticeDto> searchNotices(NoticeSearchFilter filter, UUID userId);
    
    com.acronexus.dto.ai.AiInsightDto summarizeNotice(UUID noticeId, UUID userId);
    com.acronexus.dto.ai.AiInsightDto getImportantNoticeHighlights(UUID studentId);
    com.acronexus.dto.ai.AiInsightDto getPersonalizedRecommendations(UUID studentId);
}
