package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.match.enums.MatchStatus;
import com.example.trainingmatchservice.model.match.enums.MatchType;
import com.example.trainingmatchservice.model.match.enums.SportType;

import java.time.LocalDateTime;

public record MatchResponse(
        Long id,
        Long homeTeamId,
        Long outerTeamId,
        MatchType matchType,
        MatchStatus status,
        SportType sportType,
        String venue,
        String competition,
        String season,
        Integer homeTeamScore,
        Integer awayTeamScore,
        LocalDateTime kickoffTime,
        LocalDateTime finishTime,
        String referee,
        Integer attendance,
        String matchSummary,
        String notes,
        Long matchFormationId,
        Long externalId,
        String opponentName,
        String opponentCrest
) {}

