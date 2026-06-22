package com.example.usermanagementservice.service.kafka.outboxPublisher;

public interface OutboxPublisher {
    void publishPendingEvents();
    void cleanupOldEvents();
}
