package com.example.playerservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerContractResponse {
    private Long id;
    private String playerKeycloakId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long salary;
    private Long releaseClause;
}

