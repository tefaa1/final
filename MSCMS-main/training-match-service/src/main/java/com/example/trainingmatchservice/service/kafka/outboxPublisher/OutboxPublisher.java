package com.example.trainingmatchservice.service.kafka.outboxPublisher;

public interface OutboxPublisher {

    void publishPendingEvents();
}
