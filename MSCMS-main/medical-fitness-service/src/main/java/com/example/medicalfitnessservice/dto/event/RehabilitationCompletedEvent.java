package com.example.medicalfitnessservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RehabilitationCompletedEvent {

    private Long rehabilitationId;
    private String playerKeycloakId;
    private Long injuryId;
    private String physiotherapistKeycloakId;
    private Instant timestamp;
}
