package com.example.trainingmatchservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchScheduledEvent {

    private Long matchId;
    private Long homeTeamId;
    private Long outerTeamId;
    private String matchType;
    private String venue;
    private LocalDateTime kickoffTime;
    private Instant timestamp;
}
