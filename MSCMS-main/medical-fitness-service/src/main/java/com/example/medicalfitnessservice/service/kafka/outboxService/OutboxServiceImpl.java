package com.example.medicalfitnessservice.service.kafka.outboxService;

import com.example.medicalfitnessservice.dto.event.*;
import com.example.medicalfitnessservice.model.entity.FitnessTest;
import com.example.medicalfitnessservice.model.entity.Injury;
import com.example.medicalfitnessservice.model.entity.Rehabilitation;
import com.example.medicalfitnessservice.model.entity.Treatment;
import com.example.medicalfitnessservice.model.event.OutboxEvent;
import com.example.medicalfitnessservice.repository.OutboxEventRepository;
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
    public void publishInjuryReportedEvent(Injury injury) {
        InjuryReportedEvent event = InjuryReportedEvent.builder()
                .injuryId(injury.getId())
                .playerKeycloakId(injury.getPlayerId() != null ? injury.getPlayerId().toString() : null)
                .teamId(injury.getTeamId())
                .injuryType(injury.getInjuryType() != null ? injury.getInjuryType().name() : null)
                .severity(injury.getSeverity() != null ? injury.getSeverity().name() : null)
                .bodyPart(injury.getBodyPart())
                .reportedByDoctorKeycloakId(injury.getReportedByDoctorId() != null ? injury.getReportedByDoctorId().toString() : null)
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("Injury", injury.getId().toString(), "injury.reported", event);
        log.info("Injury reported outbox event saved for injury ID: {}", injury.getId());
    }

    @Override
    @Transactional
    public void publishInjuryStatusChangedEvent(Injury injury, String oldStatus) {
        InjuryStatusChangedEvent event = InjuryStatusChangedEvent.builder()
                .injuryId(injury.getId())
                .playerKeycloakId(injury.getPlayerId() != null ? injury.getPlayerId().toString() : null)
                .teamId(injury.getTeamId())
                .oldStatus(oldStatus)
                .newStatus(injury.getStatus() != null ? injury.getStatus().name() : null)
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("Injury", injury.getId().toString(), "injury.status.changed", event);
        log.info("Injury status changed outbox event saved for injury ID: {}", injury.getId());
    }

    @Override
    @Transactional
    public void publishFitnessTestCompletedEvent(FitnessTest test) {
        FitnessTestCompletedEvent event = FitnessTestCompletedEvent.builder()
                .fitnessTestId(test.getId())
                .playerKeycloakId(test.getPlayerKeycloakId())
                .teamId(test.getTeamId())
                .testType(test.getTestType() != null ? test.getTestType().name() : null)
                .result(test.getResult())
                .conductedByDoctorKeycloakId(test.getConductedByDoctorKeycloakId())
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("FitnessTest", test.getId().toString(), "fitness.test.completed", event);
        log.info("Fitness test completed outbox event saved for fitness test ID: {}", test.getId());
    }

    @Override
    @Transactional
    public void publishTreatmentCompletedEvent(Treatment treatment) {
        TreatmentCompletedEvent event = TreatmentCompletedEvent.builder()
                .treatmentId(treatment.getId())
                .playerKeycloakId(treatment.getPlayerId() != null ? treatment.getPlayerId().toString() : null)
                .injuryId(treatment.getInjury() != null ? treatment.getInjury().getId() : null)
                .doctorKeycloakId(treatment.getDoctorId() != null ? treatment.getDoctorId().toString() : null)
                .treatmentType(treatment.getTreatmentType())
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("Treatment", treatment.getId().toString(), "treatment.completed", event);
        log.info("Treatment completed outbox event saved for treatment ID: {}", treatment.getId());
    }

    @Override
    @Transactional
    public void publishRehabilitationCompletedEvent(Rehabilitation rehab) {
        RehabilitationCompletedEvent event = RehabilitationCompletedEvent.builder()
                .rehabilitationId(rehab.getId())
                .playerKeycloakId(rehab.getPlayerId() != null ? rehab.getPlayerId().toString() : null)
                .injuryId(rehab.getInjury() != null ? rehab.getInjury().getId() : null)
                .physiotherapistKeycloakId(rehab.getPhysiotherapistId() != null ? rehab.getPhysiotherapistId().toString() : null)
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("Rehabilitation", rehab.getId().toString(), "rehabilitation.completed", event);
        log.info("Rehabilitation completed outbox event saved for rehabilitation ID: {}", rehab.getId());
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
