package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.event.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    List<OutboxEvent> findTop100BySentFalseOrderByCreatedAtAsc();

    Optional<OutboxEvent> findByAggregateIdAndEventType(String aggregateId, String eventType);

    List<OutboxEvent> findBySentTrueAndSentAtBefore(Instant timestamp);
}
