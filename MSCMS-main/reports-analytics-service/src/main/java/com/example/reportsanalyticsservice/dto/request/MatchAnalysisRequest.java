package com.example.reportsanalyticsservice.dto.request;

import com.example.reportsanalyticsservice.dto.validation.Create;
import com.example.reportsanalyticsservice.model.enums.SportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;

public record MatchAnalysisRequest(
        @NotNull(groups = Create.class) @Positive(groups = Create.class) Long matchId,
        @NotNull(groups = Create.class) @Positive(groups = Create.class) Long teamId,
        @NotNull(groups = Create.class) SportType sportType,
        String sportSpecificStats,
        String heatmapFilePath,
        String heatmapType,
        String keyMoments,
        String tacticalAnalysis,
        String playerRatings,
        @NotBlank(groups = Create.class) String analyzedByUserKeycloakId,
        LocalDateTime analyzedAt,
        String notes,
        String attachments
) {}
