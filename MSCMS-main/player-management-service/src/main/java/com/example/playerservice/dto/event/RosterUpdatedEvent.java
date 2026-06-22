package com.example.playerservice.dto.event;

import lombok.*;
import java.time.Instant;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RosterUpdatedEvent {
    private Long rosterId;
    private String playerKeycloakId;
    private Long teamId;
    private String season;
    private Instant timestamp;
}
