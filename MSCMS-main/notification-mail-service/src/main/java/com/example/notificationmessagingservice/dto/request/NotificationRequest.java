package com.example.notificationmessagingservice.dto.request;

import com.example.notificationmessagingservice.dto.validation.Create;
import com.example.notificationmessagingservice.model.enums.NotificationCategory;
import com.example.notificationmessagingservice.model.enums.NotificationStatus;
import com.example.notificationmessagingservice.model.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotificationRequest(
        @NotBlank(groups = Create.class) String recipientUserKeycloakId,
        @NotNull(groups = Create.class) NotificationType notificationType,
        NotificationCategory category,
        NotificationStatus status,
        @NotBlank(groups = Create.class) String title,
        @NotBlank(groups = Create.class) String message,
        String emailSubject,
        String emailBody,
        Long relatedEntityId,
        String relatedEntityType,
        String actionUrl
) {}
