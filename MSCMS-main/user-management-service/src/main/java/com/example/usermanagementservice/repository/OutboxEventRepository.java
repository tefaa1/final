package com.example.usermanagementservice.repository;

import com.example.usermanagementservice.model.event.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findTop100BySentFalseOrderByCreatedAtAsc();
    List<OutboxEvent> findByAggregateIdAndEventType(String aggregateId, String eventType);
    List<OutboxEvent> findBySentTrueAndSentAtBefore(Instant cutoffTime);
}
