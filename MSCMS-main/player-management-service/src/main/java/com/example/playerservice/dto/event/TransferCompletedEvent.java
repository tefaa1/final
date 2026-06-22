package com.example.playerservice.dto.event;

import lombok.*;
import java.time.Instant;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TransferCompletedEvent {
    private Long transferId;
    private String playerKeycloakId;
    private String transferType; // INCOMING or OUTGOING
    private Long fromTeamId;
    private Long toTeamId;
    private Instant timestamp;
}
