package com.example.usermanagementservice.service.kafka.outboxService;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.usermanagementservice.dto.event.*;
import com.example.usermanagementservice.model.entity.User;
import com.example.usermanagementservice.model.event.OutboxEvent;
import com.example.usermanagementservice.repository.OutboxEventRepository;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxServiceImpl implements OutboxService {

    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void publishUserCreatedEvent(User user) {
        log.debug("Publishing user created event for user: {}", user.getId());
        UserCreatedEvent event = UserCreatedEvent.builder()
                .userId(user.getId())
                .keycloakId(user.getKeycloakId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .timestamp(Instant.now())
                .build();
        saveOutboxEvent("user", String.valueOf(user.getId()), "user.created", event);
    }

    @Override
    @Transactional
    public void publishUserUpdatedEvent(User user) {
        log.debug("Publishing user updated event for user: {}", user.getId());
        UserUpdatedEvent event = UserUpdatedEvent.builder()
                .userId(user.getId())
                .keycloakId(user.getKeycloakId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .timestamp(Instant.now())
                .build();
        saveOutboxEvent("user", String.valueOf(user.getId()), "user.updated", event);
    }

    @Override
    @Transactional
    public void publishUserDeletedEvent(User user) {
        log.debug("Publishing user deleted event for user: {}", user.getId());
        UserDeletedEvent event = UserDeletedEvent.builder()
                .userId(user.getId())
                .keycloakId(user.getKeycloakId())
                .role(user.getRole().name())
                .timestamp(Instant.now())
                .build();
        saveOutboxEvent("user", String.valueOf(user.getId()), "user.deleted", event);
    }

    @Override
    @Transactional
    public void publishPlayerStatusChangedEvent(Long playerId, String keycloakId, String firstName, String lastName, String oldStatus, String newStatus) {
        log.debug("Publishing player status changed event for player: {}", playerId);
        PlayerStatusChangedEvent event = PlayerStatusChangedEvent.builder()
                .playerId(playerId)
                .keycloakId(keycloakId)
                .firstName(firstName)
                .lastName(lastName)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .timestamp(Instant.now())
                .build();
        saveOutboxEvent("player", String.valueOf(playerId), "player.status.changed", event);
    }

    private void saveOutboxEvent(String aggregateType, String aggregateId, String eventType, Object payload) {
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .eventType(eventType)
                    .payload(payloadJson)
                    .sent(false)
                    .createdAt(Instant.now())
                    .retryCount(0)
                    .build();
            outboxRepository.save(outboxEvent);
            log.info("Outbox event saved: type={}, aggregateId={}", eventType, aggregateId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event payload", e);
            throw new RuntimeException("Failed to create outbox event", e);
        }
    }
}
