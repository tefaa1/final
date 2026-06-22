package com.example.notificationmessagingservice.dto.event;

import lombok.*;
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
