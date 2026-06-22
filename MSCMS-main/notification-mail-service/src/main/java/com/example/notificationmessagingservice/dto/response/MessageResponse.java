package com.example.notificationmessagingservice.dto.response;

import com.example.notificationmessagingservice.model.enums.MessageStatus;
import java.time.LocalDateTime;

public record MessageResponse(
                Long id,
                String senderUserKeycloakId,
                String recipientUserKeycloakId,
                String subject,
                String content,
                MessageStatus status,
                LocalDateTime sentAt,
                LocalDateTime deliveredAt,
                LocalDateTime readAt,
                Long parentMessageId,
                Long groupId) {
}
