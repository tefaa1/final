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
public class MatchCancelledEvent {

    private Long matchId;
    private Long homeTeamId;
    private Long outerTeamId;
    private String reason;
    private Instant timestamp;
}
