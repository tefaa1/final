package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.match.enums.EventType;

public record MatchEventResponse(
        Long id,
        Long matchId,
        String playerKeycloakId,
        Long teamId,
        EventType eventType,
        Integer minute,
        Integer extraTime,
        String description
) {}

