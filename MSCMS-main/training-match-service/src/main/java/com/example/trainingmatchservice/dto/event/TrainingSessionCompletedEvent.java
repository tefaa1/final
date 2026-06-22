package com.example.trainingmatchservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingSessionCompletedEvent {

    private Long sessionId;
    private Long teamId;
    private String headCoachKeycloakId;
    private String trainingType;
    private Integer durationMinutes;
    private Instant timestamp;
}
