package com.example.trainingmatchservice.service.kafka.outboxPublisher;

import com.example.trainingmatchservice.model.event.OutboxEvent;
import com.example.trainingmatchservice.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxPublisherImpl implements OutboxPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Override
    @Scheduled(fixedRate = 5000)
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

                log.info("Successfully published outbox event [id={}, type={}, topic={}]",
                        event.getId(), event.getEventType(), topic);
            } catch (Exception e) {
                event.setRetryCount(event.getRetryCount() + 1);
                outboxEventRepository.save(event);

                log.error("Failed to publish outbox event [id={}, type={}, retryCount={}]: {}",
                        event.getId(), event.getEventType(), event.getRetryCount(), e.getMessage());
            }
        }
    }

    private String resolveTopicName(String eventType) {
        return switch (eventType) {
            case "match.scheduled" -> "match-scheduled";
            case "match.completed" -> "match-completed";
            case "match.cancelled" -> "match-cancelled";
            case "training.session.completed" -> "training-session-completed";
            case "training.session.cancelled" -> "training-session-cancelled";
            default -> "training-match-events";
        };
    }
}
