package com.example.usermanagementservice.service.kafka.outboxPublisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.usermanagementservice.model.event.OutboxEvent;
import com.example.usermanagementservice.repository.OutboxEventRepository;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisherImpl implements OutboxPublisher {
    private final OutboxEventRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Override
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void publishPendingEvents() {
        try {
            List<OutboxEvent> pendingEvents = outboxRepository.findTop100BySentFalseOrderByCreatedAtAsc();
            if (!pendingEvents.isEmpty()) {
                log.debug("Publishing {} pending outbox events", pendingEvents.size());
                for (OutboxEvent event : pendingEvents) {
                    try {
                        String topic = getTopicForEventType(event.getEventType());
                        kafkaTemplate.send(topic, event.getAggregateId(), event.getPayload())
                                .whenComplete((result, ex) -> {
                                    if (ex == null) {
                                        markEventAsSent(event);
                                        log.debug("Event published to Kafka: id={}, topic={}", event.getId(), topic);
                                    } else {
                                        handlePublishFailure(event, ex);
                                    }
                                });
                    } catch (Exception e) {
                        log.error("Failed to publish event: id={}", event.getId(), e);
                        event.setRetryCount(event.getRetryCount() + 1);
                        outboxRepository.save(event);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in outbox publisher", e);
        }
    }

    @Transactional
    public void markEventAsSent(OutboxEvent event) {
        event.setSent(true);
        event.setSentAt(Instant.now());
        outboxRepository.save(event);
    }

    private void handlePublishFailure(OutboxEvent event, Throwable ex) {
        log.error("Failed to publish event to Kafka: id={}", event.getId(), ex);
        event.setRetryCount(event.getRetryCount() + 1);
        if (event.getRetryCount() > 10) {
            log.error("Event exceeded max retries: id={}", event.getId());
        }
        outboxRepository.save(event);
    }

    private String getTopicForEventType(String eventType) {
        return switch (eventType) {
            case "user.created" -> "user-created";
            case "user.updated" -> "user-updated";
            case "user.deleted" -> "user-deleted";
            case "player.status.changed" -> "player-status-changed";
            default -> "user-events";
        };
    }

    @Override
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldEvents() {
        log.debug("Starting cleanup of old outbox events");
        try {
            Instant cutoffTime = Instant.now().minusSeconds(30L * 24 * 60 * 60);
            List<OutboxEvent> oldEvents = outboxRepository.findBySentTrueAndSentAtBefore(cutoffTime);
            if (!oldEvents.isEmpty()) {
                outboxRepository.deleteAll(oldEvents);
                log.info("Cleaned up {} old outbox events", oldEvents.size());
            }
        } catch (Exception e) {
            log.error("Error during outbox cleanup", e);
        }
    }
}
