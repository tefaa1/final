package com.example.notificationmessagingservice.dto.event;

import lombok.*;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingSessionCancelledEvent {
    private Long sessionId;
    private Long teamId;
    private String headCoachKeycloakId;
    private String reason;
    private Instant timestamp;
}
