package com.example.notificationmessagingservice.dto.request;

import com.example.notificationmessagingservice.dto.validation.Create;
import com.example.notificationmessagingservice.model.enums.MessageStatus;
import jakarta.validation.constraints.NotBlank;

public record MessageRequest(
                @NotBlank(groups = Create.class) String senderUserKeycloakId,
                @NotBlank(groups = Create.class) String recipientUserKeycloakId,
                @NotBlank(groups = Create.class) String subject,
                @NotBlank(groups = Create.class) String content,
                MessageStatus status,
                Long parentMessageId,
                Long groupId) {
}
