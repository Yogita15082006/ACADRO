package com.acronexus.service;

import com.acronexus.dto.request.NotificationRequest;
import com.acronexus.dto.response.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    NotificationResponse createNotification(NotificationRequest request);
    NotificationResponse updateNotification(UUID id, NotificationRequest request);
    void deleteNotification(UUID id);
    NotificationResponse getNotification(UUID id);
    List<NotificationResponse> listUserNotifications(UUID userId);
    Page<NotificationResponse> getMyNotifications(Pageable pageable);
    void markAsRead(UUID id);
    void markAllAsRead();
    long getUnreadCount();

    // Internal methods for system-generated notifications
    void createSystemNotification(UUID targetUserId, String title, String message, String type, String referenceId);
    void createBulkSystemNotifications(List<UUID> targetUserIds, String title, String message, String type, String referenceId);

    void registerDeviceToken(String token);
    void unregisterDeviceToken(String token);
}
