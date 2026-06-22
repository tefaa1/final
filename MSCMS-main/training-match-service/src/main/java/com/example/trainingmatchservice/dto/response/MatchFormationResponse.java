package com.example.trainingmatchservice.dto.response;

public record MatchFormationResponse(
        Long id,
        Long teamId,
        String setByCoachKeycloakId,
        String formation,
        String tacticalApproach,
        String formationDetails
) {}

