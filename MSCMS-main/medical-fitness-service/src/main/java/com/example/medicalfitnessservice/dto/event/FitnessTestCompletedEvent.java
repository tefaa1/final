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
public class FitnessTestCompletedEvent {

    private Long fitnessTestId;
    private String playerKeycloakId;
    private Long teamId;
    private String testType;
    private Double result;
    private String conductedByDoctorKeycloakId;
    private Instant timestamp;
}
