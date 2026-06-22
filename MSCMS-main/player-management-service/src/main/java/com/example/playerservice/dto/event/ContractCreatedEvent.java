package com.example.playerservice.dto.event;

import lombok.*;
import java.time.Instant;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ContractCreatedEvent {
    private Long contractId;
    private String playerKeycloakId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long salary;
    private Instant timestamp;
}
