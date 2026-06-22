package com.example.reportsanalyticsservice.dto.response;

import java.time.LocalDateTime;

public record ScoutReportResponse(
        Long id,
        String scoutKeycloakId,
        Long outerPlayerId,
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
