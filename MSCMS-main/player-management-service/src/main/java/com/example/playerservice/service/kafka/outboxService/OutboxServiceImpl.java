package com.example.playerservice.service.kafka.outboxService;

import com.example.playerservice.dto.event.*;
import com.example.playerservice.model.entity.*;
import com.example.playerservice.model.event.OutboxEvent;
import com.example.playerservice.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxServiceImpl implements OutboxService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void publishTransferIncomingCompletedEvent(PlayerTransferIncoming transfer) {
        TransferCompletedEvent event = TransferCompletedEvent.builder()
                .transferId(transfer.getId())
                .playerKeycloakId(String.valueOf(transfer.getOuterPlayer().getId()))
                .transferType("INCOMING")
                .fromTeamId(transfer.getFromTeam().getId())
                .toTeamId(transfer.getToTeam().getId())
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("PlayerTransfer", String.valueOf(transfer.getId()), "transfer.incoming.completed", event);
    }

    @Override
    @Transactional
    public void publishTransferOutgoingCompletedEvent(PlayerTransferOutgoing transfer) {
        TransferCompletedEvent event = TransferCompletedEvent.builder()
                .transferId(transfer.getId())
                .playerKeycloakId(transfer.getPlayerKeycloakId())
                .transferType("OUTGOING")
                .fromTeamId(transfer.getFromTeam().getId())
                .toTeamId(transfer.getToTeam().getId())
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("PlayerTransfer", String.valueOf(transfer.getId()), "transfer.outgoing.completed", event);
    }

    @Override
    @Transactional
    public void publishContractCreatedEvent(PlayerContract contract) {
        ContractCreatedEvent event = ContractCreatedEvent.builder()
                .contractId(contract.getId())
                .playerKeycloakId(contract.getPlayerKeycloakId())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .salary(contract.getSalary())
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("PlayerContract", String.valueOf(contract.getId()), "contract.created", event);
    }

    @Override
    @Transactional
    public void publishRosterUpdatedEvent(Roster roster) {
        RosterUpdatedEvent event = RosterUpdatedEvent.builder()
                .rosterId(roster.getId())
                .playerKeycloakId(String.valueOf(roster.getPlayerId()))
                .teamId(roster.getTeam().getId())
                .season(roster.getSeason())
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("Roster", String.valueOf(roster.getId()), "roster.updated", event);
    }

    @Override
    @Transactional
    public void publishCallUpApprovedEvent(PlayerCallUpRequest callUp) {
        CallUpApprovedEvent event = CallUpApprovedEvent.builder()
                .callUpId(callUp.getId())
                .playerKeycloakId(callUp.getPlayerKeycloakId())
                .nationalTeamKeycloakId(callUp.getNationalTeamKeycloakId())
                .timestamp(Instant.now())
                .build();

        saveOutboxEvent("PlayerCallUp", String.valueOf(callUp.getId()), "callup.approved", event);
    }

    private void saveOutboxEvent(String aggregateType, String aggregateId, String eventType, Object event) {
        try {
            String payload = objectMapper.writeValueAsString(event);

            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .eventType(eventType)
                    .payload(payload)
                    .sent(false)
                    .createdAt(Instant.now())
                    .retryCount(0)
                    .build();

            outboxEventRepository.save(outboxEvent);
            log.info("Outbox event saved: type={}, aggregateId={}", eventType, aggregateId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize outbox event: type={}, aggregateId={}", eventType, aggregateId, e);
            throw new RuntimeException("Failed to serialize outbox event", e);
        }
    }
}
