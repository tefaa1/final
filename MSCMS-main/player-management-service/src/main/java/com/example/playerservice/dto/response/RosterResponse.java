package com.example.playerservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RosterResponse {
    private Long id;
    private Long playerId;
    private String season;
    private Long teamId;
}

