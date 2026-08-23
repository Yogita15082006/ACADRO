package com.acronexus.service.impl;

import com.acronexus.entity.UserFcmToken;
import com.acronexus.repository.UserFcmTokenRepository;
import com.acronexus.service.FcmNotificationService;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FcmNotificationServiceImpl implements FcmNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(FcmNotificationServiceImpl.class);
    private final UserFcmTokenRepository tokenRepository;

    @Override
    @Async
    public void sendPushNotification(UUID userId, String title, String body, String type, String referenceId) {
        List<UserFcmToken> activeTokens = tokenRepository.findByUser_IdAndIsActiveTrue(userId);

        if (activeTokens.isEmpty()) {
            return;
        }

        for (UserFcmToken token : activeTokens) {
            try {
                Message.Builder messageBuilder = Message.builder()
                        .setToken(token.getToken())
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build());

                if (type != null) {
                    messageBuilder.putData("type", type);
                }
                if (referenceId != null) {
                    messageBuilder.putData("referenceId", referenceId);
                }

                FirebaseMessaging.getInstance().send(messageBuilder.build());
                
                token.setLastUsedAt(Instant.now());
                tokenRepository.save(token);
                
            } catch (FirebaseMessagingException e) {
                logger.warn("Failed to send FCM message to token for user {}: {}", userId, e.getMessage());
                String errorCode = e.getMessagingErrorCode() != null ? e.getMessagingErrorCode().name() : "";
                
                // If token is invalid or unregistered, deactivate it.
                if ("UNREGISTERED".equals(errorCode) || "INVALID_ARGUMENT".equals(errorCode)) {
                    token.setIsActive(false);
                    tokenRepository.save(token);
                }
            } catch (Exception e) {
                logger.error("Unexpected error sending FCM notification to user {}", userId, e);
            }
        }
    }
}
