package com.example.playerservice.service.kafka.outboxService;

import com.example.playerservice.model.entity.*;

public interface OutboxService {
    void publishTransferIncomingCompletedEvent(PlayerTransferIncoming transfer);
    void publishTransferOutgoingCompletedEvent(PlayerTransferOutgoing transfer);
    void publishContractCreatedEvent(PlayerContract contract);
    void publishRosterUpdatedEvent(Roster roster);
    void publishCallUpApprovedEvent(PlayerCallUpRequest callUp);
}
