package com.acronexus.service.impl;

import com.acronexus.dto.request.NotificationRequest;
import com.acronexus.dto.response.NotificationResponse;
import com.acronexus.entity.User;
import com.acronexus.entity.UserNotification;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.NotificationMapper;
import com.acronexus.repository.UserNotificationRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.NotificationService;
import com.acronexus.entity.UserFcmToken;
import com.acronexus.repository.UserFcmTokenRepository;
import com.acronexus.service.FcmNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;
    private final UserFcmTokenRepository tokenRepository;
    private final FcmNotificationService fcmNotificationService;

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        UserDetailsImpl currentUserDetails = getCurrentUser();
        User currentUser = userRepository.findById(currentUserDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        User targetUser = userRepository.findById(request.getTargetUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        validateAdminOrHodAccess(currentUser, targetUser);

        UserNotification notification = notificationMapper.toEntity(request);
        notification.setUser(targetUser);

        UserNotification saved = notificationRepository.save(notification);
        return notificationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public NotificationResponse updateNotification(UUID id, NotificationRequest request) {
        UserNotification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        UserDetailsImpl currentUserDetails = getCurrentUser();
        User currentUser = userRepository.findById(currentUserDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        validateAdminOrHodAccess(currentUser, notification.getUser());

        notificationMapper.updateEntity(notification, request);

        if (request.getTargetUserId() != null && !request.getTargetUserId().equals(notification.getUser().getId())) {
            User newTarget = userRepository.findById(request.getTargetUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));
            validateAdminOrHodAccess(currentUser, newTarget);
            notification.setUser(newTarget);
        }

        UserNotification saved = notificationRepository.save(notification);
        return notificationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteNotification(UUID id) {
        UserNotification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        UserDetailsImpl currentUserDetails = getCurrentUser();
        User currentUser = userRepository.findById(currentUserDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        validateAdminOrHodAccess(currentUser, notification.getUser());

        notificationRepository.delete(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getNotification(UUID id) {
        UserNotification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        UserDetailsImpl currentUserDetails = getCurrentUser();

        if (isAdmin(currentUserDetails)) {
            return notificationMapper.toResponse(notification);
        }

        User currentUser = userRepository.findById(currentUserDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        if (isHod(currentUserDetails) && isSameDepartment(currentUser, notification.getUser())) {
            return notificationMapper.toResponse(notification);
        }

        if (notification.getUser().getId().equals(currentUserDetails.getId())) {
            return notificationMapper.toResponse(notification);
        }

        throw new AccessDeniedException("You do not have permission to view this notification");
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> listUserNotifications(UUID userId) {
        UserDetailsImpl currentUserDetails = getCurrentUser();
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User currentUser = userRepository.findById(currentUserDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        validateAdminOrHodAccess(currentUser, targetUser);

        return notificationRepository.findByUserIdWithUser(userId).stream()
                .map(notificationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {
        UserDetailsImpl currentUser = getCurrentUser();
        return notificationRepository.findByUserIdWithUser(currentUser.getId(), pageable)
                .map(notificationMapper::toResponse);
    }

    @Override
    @Transactional
    public void markAsRead(UUID id) {
        UserNotification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        UserDetailsImpl currentUser = getCurrentUser();
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only mark your own notifications as read");
        }

        notification.setIsRead(true);
        notification.setReadAt(Instant.now());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        UserDetailsImpl currentUser = getCurrentUser();
        notificationRepository.markAllAsReadByUserId(currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        UserDetailsImpl currentUser = getCurrentUser();
        return notificationRepository.countByUser_IdAndIsReadFalse(currentUser.getId());
    }

    @Override
    @Transactional
    public void createSystemNotification(UUID targetUserId, String title, String message, String type, String referenceId) {
        if (referenceId != null && type != null) {
            boolean exists = notificationRepository.existsByUser_IdAndTypeAndReferenceId(targetUserId, type, referenceId);
            if (exists) {
                return; // Prevent duplicate
            }
        }
        
        User targetUser = userRepository.findById(targetUserId).orElse(null);
        if (targetUser == null) return;
        
        UserNotification notification = new UserNotification();
        notification.setUser(targetUser);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        notification.setModule(type); // Using type as module for simplicity
        
        notificationRepository.save(notification);

        // Push delivery (non-blocking if possible, but currently inline async inside FcmService)
        fcmNotificationService.sendPushNotification(targetUserId, title, message, type, referenceId);
    }

    @Override
    @Transactional
    public void createBulkSystemNotifications(List<UUID> targetUserIds, String title, String message, String type, String referenceId) {
        if (targetUserIds == null || targetUserIds.isEmpty()) return;
        
        List<UserNotification> notificationsToSave = new java.util.ArrayList<>();
        
        for (UUID userId : targetUserIds) {
            if (referenceId != null && type != null) {
                boolean exists = notificationRepository.existsByUser_IdAndTypeAndReferenceId(userId, type, referenceId);
                if (exists) continue; // Prevent duplicate
            }
            
            User targetUser = userRepository.findById(userId).orElse(null);
            if (targetUser == null) continue;
            
            UserNotification notification = new UserNotification();
            notification.setUser(targetUser);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType(type);
            notification.setReferenceId(referenceId);
            notification.setModule(type);
            
            notificationsToSave.add(notification);
        }
        
        if (!notificationsToSave.isEmpty()) {
            notificationRepository.saveAll(notificationsToSave);
            
            // Push delivery
            for (UserNotification n : notificationsToSave) {
                fcmNotificationService.sendPushNotification(
                    n.getUser().getId(), n.getTitle(), n.getMessage(), n.getType(), n.getReferenceId()
                );
            }
        }
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) auth.getPrincipal();
    }

    private void validateAdminOrHodAccess(User currentUser, User targetUser) {
        UserDetailsImpl currentUserDetails = getCurrentUser();

        if (isAdmin(currentUserDetails)) {
            return;
        }

        if (isHod(currentUserDetails)) {
            if (!isSameDepartment(currentUser, targetUser)) {
                throw new AccessDeniedException("HOD can only manage notifications within their own department");
            }
            return;
        }

        throw new AccessDeniedException("You do not have permission to perform this action");
    }

    private boolean isAdmin(UserDetailsImpl user) {
        return user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private boolean isHod(UserDetailsImpl user) {
        return user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HOD"));
    }

    private boolean isSameDepartment(User user1, User user2) {
        return user1.getDepartment() != null
                && user2.getDepartment() != null
                && user1.getDepartment().getId().equals(user2.getDepartment().getId());
    }

    @Override
    @Transactional
    public void registerDeviceToken(String token) {
        UserDetailsImpl currentUser = getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserFcmToken fcmToken = tokenRepository.findByToken(token).orElse(null);
        if (fcmToken != null) {
            if (!fcmToken.getUser().getId().equals(user.getId())) {
                fcmToken.setUser(user);
            }
            fcmToken.setIsActive(true);
            fcmToken.setLastUsedAt(Instant.now());
            tokenRepository.save(fcmToken);
        } else {
            fcmToken = UserFcmToken.builder()
                    .user(user)
                    .token(token)
                    .isActive(true)
                    .lastUsedAt(Instant.now())
                    .build();
            tokenRepository.save(fcmToken);
        }
    }

    @Override
    @Transactional
    public void unregisterDeviceToken(String token) {
        tokenRepository.findByToken(token).ifPresent(fcmToken -> {
            fcmToken.setIsActive(false);
            tokenRepository.save(fcmToken);
        });
    }
}
