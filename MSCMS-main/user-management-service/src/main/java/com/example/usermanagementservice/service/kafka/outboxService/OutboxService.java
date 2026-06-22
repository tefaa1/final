package com.example.usermanagementservice.service.kafka.outboxService;

import com.example.usermanagementservice.model.entity.User;

public interface OutboxService {
    void publishUserCreatedEvent(User user);
    void publishUserUpdatedEvent(User user);
    void publishUserDeletedEvent(User user);
    void publishPlayerStatusChangedEvent(Long playerId, String keycloakId, String firstName, String lastName, String oldStatus, String newStatus);
}
