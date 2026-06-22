package com.example.trainingmatchservice.service.kafka.outboxService;

import com.example.trainingmatchservice.dto.event.*;
import com.example.trainingmatchservice.model.event.OutboxEvent;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import com.example.trainingmatchservice.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxServiceImpl implements OutboxService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void publishMatchScheduledEvent(Match match) {
        MatchScheduledEvent event = MatchScheduledEvent.builder()
                .matchId(match.getId())
                .homeTeamId(match.getHomeTeamId())
                .outerTeamId(match.getOuterTeamId())
                .matchType(match.getMatchType() != null ? match.getMatchType().name() : null)
                .venue(match.getVenue())
                .kickoffTime(match.getKickoffTime())
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("Match", match.getId().toString(), "match.scheduled", event);
        log.info("Match scheduled outbox event saved for match ID: {}", match.getId());
    }

    @Override
    @Transactional
    public void publishMatchCompletedEvent(Match match) {
        MatchCompletedEvent event = MatchCompletedEvent.builder()
                .matchId(match.getId())
                .homeTeamId(match.getHomeTeamId())
                .outerTeamId(match.getOuterTeamId())
                .homeTeamScore(match.getHomeTeamScore())
                .awayTeamScore(match.getAwayTeamScore())
                .matchType(match.getMatchType() != null ? match.getMatchType().name() : null)
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("Match", match.getId().toString(), "match.completed", event);
        log.info("Match completed outbox event saved for match ID: {}", match.getId());
    }

    @Override
    @Transactional
    public void publishMatchCancelledEvent(Match match, String reason) {
        MatchCancelledEvent event = MatchCancelledEvent.builder()
                .matchId(match.getId())
                .homeTeamId(match.getHomeTeamId())
                .outerTeamId(match.getOuterTeamId())
                .reason(reason)
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("Match", match.getId().toString(), "match.cancelled", event);
        log.info("Match cancelled outbox event saved for match ID: {}", match.getId());
    }

    @Override
    @Transactional
    public void publishTrainingSessionCompletedEvent(TrainingSession session) {
        TrainingSessionCompletedEvent event = TrainingSessionCompletedEvent.builder()
                .sessionId(session.getId())
                .teamId(session.getTeamId())
                .headCoachKeycloakId(session.getHeadCoachId() != null ? session.getHeadCoachId().toString() : null)
                .trainingType(session.getTrainingType() != null ? session.getTrainingType().name() : null)
                .durationMinutes(session.getDurationMinutes())
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("TrainingSession", session.getId().toString(), "training.session.completed", event);
        log.info("Training session completed outbox event saved for session ID: {}", session.getId());
    }

    @Override
    @Transactional
    public void publishTrainingSessionCancelledEvent(TrainingSession session, String reason) {
        TrainingSessionCancelledEvent event = TrainingSessionCancelledEvent.builder()
                .sessionId(session.getId())
                .teamId(session.getTeamId())
                .headCoachKeycloakId(session.getHeadCoachId() != null ? session.getHeadCoachId().toString() : null)
                .reason(reason)
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("TrainingSession", session.getId().toString(), "training.session.cancelled", event);
        log.info("Training session cancelled outbox event saved for session ID: {}", session.getId());
    }

    private void saveOutboxEvent(String aggregateType, String aggregateId, String eventType, Object event) {
        try {
            String payload = objectMapper.writeValueAsString(event);

            OutboxEvent outboxEvent = new OutboxEvent();
            outboxEvent.setAggregateType(aggregateType);
            outboxEvent.setAggregateId(aggregateId);
            outboxEvent.setEventType(eventType);
            outboxEvent.setPayload(payload);
            outboxEvent.setSent(false);
            outboxEvent.setRetryCount(0);

            outboxEventRepository.save(outboxEvent);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize outbox event for aggregate {} with ID {}: {}",
                    aggregateType, aggregateId, e.getMessage());
            throw new RuntimeException("Failed to serialize outbox event", e);
        }
    }
}
