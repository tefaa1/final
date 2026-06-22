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
public class MatchCompletedEvent {

    private Long matchId;
    private Long homeTeamId;
    private Long outerTeamId;
    private Integer homeTeamScore;
    private Integer awayTeamScore;
    private String matchType;
    private Instant timestamp;
}
