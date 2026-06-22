package com.example.playerservice.service.kafka.outboxPublisher;

import com.example.playerservice.model.event.OutboxEvent;
import com.example.playerservice.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisherImpl implements OutboxPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final int MAX_RETRY_COUNT = 5;

    @Override
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findTop100BySentFalseOrderByCreatedAtAsc();

        for (OutboxEvent event : pendingEvents) {
            try {
                String topic = resolveTopicName(event.getEventType());

                kafkaTemplate.send(topic, event.getAggregateId(), event.getPayload());

                event.setSent(true);
                event.setSentAt(Instant.now());
                outboxEventRepository.save(event);

                log.info("Published outbox event: id={}, type={}, topic={}", event.getId(), event.getEventType(), topic);
            } catch (Exception e) {
                event.setRetryCount(event.getRetryCount() + 1);
                outboxEventRepository.save(event);

                if (event.getRetryCount() >= MAX_RETRY_COUNT) {
                    log.error("Max retries reached for outbox event: id={}, type={}", event.getId(), event.getEventType(), e);
                } else {
                    log.warn("Failed to publish outbox event (retry {}): id={}, type={}", event.getRetryCount(), event.getId(), event.getEventType(), e);
                }
            }
        }
    }

    @Override
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldEvents() {
        Instant cutoffTime = Instant.now().minus(7, ChronoUnit.DAYS);
        List<OutboxEvent> oldEvents = outboxEventRepository.findBySentTrueAndSentAtBefore(cutoffTime);

        if (!oldEvents.isEmpty()) {
            outboxEventRepository.deleteAll(oldEvents);
            log.info("Cleaned up {} old outbox events", oldEvents.size());
        }
    }

    private String resolveTopicName(String eventType) {
        return switch (eventType) {
            case "transfer.incoming.completed" -> "transfer-incoming-completed";
            case "transfer.outgoing.completed" -> "transfer-outgoing-completed";
            case "contract.created" -> "contract-created";
            case "roster.updated" -> "roster-updated";
            case "callup.approved" -> "callup-approved";
            default -> "player-management-events";
        };
    }
}
