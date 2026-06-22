package com.example.notificationmessagingservice.dto.response;

import com.example.notificationmessagingservice.model.enums.AlertPriority;
import com.example.notificationmessagingservice.model.enums.AlertType;
import java.time.LocalDateTime;

public record AlertResponse(
        Long id,
        AlertType alertType,
        AlertPriority priority,
        String title,
        String message,
        String description,
        String targetUserKeycloakId,
        String targetRole,
        Long relatedEntityId,
        String relatedEntityType,
        LocalDateTime triggeredAt,
        LocalDateTime acknowledgedAt,
        String acknowledgedByUserKeycloakId,
        Boolean isAcknowledged,
        Boolean isResolved,
        LocalDateTime resolvedAt,
        String actionRequired,
        String metadata
) {}
