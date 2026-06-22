package com.example.notificationmessagingservice.dto.response;

import com.example.notificationmessagingservice.model.enums.NotificationCategory;
import com.example.notificationmessagingservice.model.enums.NotificationStatus;
import com.example.notificationmessagingservice.model.enums.NotificationType;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String recipientUserKeycloakId,
        NotificationType notificationType,
        NotificationCategory category,
        NotificationStatus status,
        String title,
        String message,
        String emailSubject,
        String emailBody,
        Long relatedEntityId,
        String relatedEntityType,
        LocalDateTime createdAt,
        LocalDateTime sentAt,
        LocalDateTime readAt,
        String actionUrl,
        Boolean isRead
) {}
