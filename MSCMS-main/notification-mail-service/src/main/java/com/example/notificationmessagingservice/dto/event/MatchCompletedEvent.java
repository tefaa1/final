package com.example.notificationmessagingservice.dto.event;

import lombok.*;
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
