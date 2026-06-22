package com.example.reportsanalyticsservice.dto.response;

import com.example.reportsanalyticsservice.model.enums.SportType;
import java.time.LocalDateTime;

public record MatchAnalysisResponse(
        Long id,
        Long matchId,
        Long teamId,
        SportType sportType,
        String sportSpecificStats,
        String heatmapFilePath,
        String heatmapType,
        String keyMoments,
        String tacticalAnalysis,
        String playerRatings,
        String analyzedByUserKeycloakId,
        LocalDateTime analyzedAt,
        String notes,
        String attachments
) {}
