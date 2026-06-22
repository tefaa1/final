package com.example.playerservice.dto.event;

import lombok.*;
import java.time.Instant;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CallUpApprovedEvent {
    private Long callUpId;
    private String playerKeycloakId;
    private String nationalTeamKeycloakId;
    private Instant timestamp;
}
