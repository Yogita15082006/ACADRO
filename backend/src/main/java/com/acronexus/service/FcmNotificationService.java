package com.acronexus.service;

import java.util.UUID;

public interface FcmNotificationService {
    void sendPushNotification(UUID userId, String title, String body, String type, String referenceId);
}
