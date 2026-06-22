package com.example.medicalfitnessservice.service.kafka.outboxPublisher;

public interface OutboxPublisher {

    void publishPendingEvents();
}
