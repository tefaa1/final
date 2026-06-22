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
public class InjuryStatusChangedEvent {

    private Long injuryId;
    private String playerKeycloakId;
    private Long teamId;
    private String oldStatus;
    private String newStatus;
    private Instant timestamp;
}
