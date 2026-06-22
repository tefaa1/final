package com.example.notificationmessagingservice.dto.request;

import com.example.notificationmessagingservice.dto.validation.Create;
import com.example.notificationmessagingservice.model.enums.AlertPriority;
import com.example.notificationmessagingservice.model.enums.AlertType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AlertRequest(
        @NotNull(groups = Create.class) AlertType alertType,
        @NotNull(groups = Create.class) AlertPriority priority,
        @NotBlank(groups = Create.class) String title,
        @NotBlank(groups = Create.class) String message,
        String description,
        String targetUserKeycloakId,
        String targetRole,
        Long relatedEntityId,
        String relatedEntityType,
        String actionRequired,
        String metadata
) {}
