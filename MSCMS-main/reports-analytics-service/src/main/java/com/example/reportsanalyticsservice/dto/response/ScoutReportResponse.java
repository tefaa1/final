package com.example.reportsanalyticsservice.dto.response;

import java.time.LocalDateTime;

public record ScoutReportResponse(
        Long id,
        String scoutKeycloakId,
        Long outerPlayerId,
        String playerCountry,
        String playerPosition,
        String playerClub,
        String sportType,
        Integer technicalRating,
        Integer physicalRating,
        Integer tacticalRating,
        Integer mentalityRating,
        String strengths,
        String weaknesses,
        String overallAssessment,
        Boolean recommendSigning,
        LocalDateTime createdAt
) {}
