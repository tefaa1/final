package com.example.reportsanalyticsservice.dto.response;

import com.example.reportsanalyticsservice.model.enums.SportType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TeamAnalyticsResponse(
        Long id,
        Long teamId,
        SportType sportType,
        LocalDate periodStart,
        LocalDate periodEnd,
        Integer totalMatches,
        Integer wins,
        Integer draws,
        Integer losses,
        Integer pointsFor,
        Integer pointsAgainst,
        Double averageTeamFitnessScore,
        Integer totalInjuries,
        Integer totalTrainingSessions,
        String kpiData,
        String sportSpecificStats,
        String trends,
        LocalDateTime calculatedAt,
        String notes
) {}
