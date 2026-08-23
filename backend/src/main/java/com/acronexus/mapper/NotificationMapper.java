package com.acronexus.mapper;

import com.acronexus.dto.request.NotificationRequest;
import com.acronexus.dto.response.NotificationResponse;
import com.acronexus.entity.UserNotification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public UserNotification toEntity(NotificationRequest request) {
        if (request == null) {
            return null;
        }
        UserNotification notification = new UserNotification();
        notification.setModule(request.getModule());
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setActionPath(request.getActionPath());
        notification.setType(request.getType());
        notification.setReferenceId(request.getReferenceId());
        notification.setIsRead(false);
        return notification;
    }

    public void updateEntity(UserNotification notification, NotificationRequest request) {
        if (request == null || notification == null) {
            return;
        }
        notification.setModule(request.getModule());
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setActionPath(request.getActionPath());
        notification.setType(request.getType());
        notification.setReferenceId(request.getReferenceId());
    }

    public NotificationResponse toResponse(UserNotification notification) {
        if (notification == null) {
            return null;
        }
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        if (notification.getUser() != null) {
            response.setTargetUserId(notification.getUser().getId());
        }
        response.setModule(notification.getModule());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setActionPath(notification.getActionPath());
        response.setType(notification.getType());
        response.setIsRead(notification.getIsRead());
        response.setCreatedAt(notification.getCreatedAt());
        response.setReadAt(notification.getReadAt());
        response.setReferenceId(notification.getReferenceId());
        return response;
    }
}
