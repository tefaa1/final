package com.example.notificationmessagingservice.dto.event;

import lombok.*;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerStatusChangedEvent {
    private Long playerId;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private String oldStatus;
    private String newStatus;
    private Instant timestamp;
}
