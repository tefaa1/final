package com.example.playerservice.service.kafka.outboxPublisher;

public interface OutboxPublisher {
    void publishPendingEvents();
    void cleanupOldEvents();
}
