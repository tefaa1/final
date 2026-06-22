package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.match.enums.LineupStatus;
import com.example.trainingmatchservice.model.match.enums.Position;

public record MatchLineupResponse(
        Long id,
        Long teamId,
        Long playerId,
        Long matchFormationId,
        LineupStatus lineupStatus,
        Position position,
        Integer jerseyNumber,
        Boolean wasSubstituted,
        Integer substitutionMinute,
        Long substitutedByPlayerId
) {}

