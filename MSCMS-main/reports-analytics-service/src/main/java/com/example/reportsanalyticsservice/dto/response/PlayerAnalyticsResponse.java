package com.example.reportsanalyticsservice.dto.response;

import com.example.reportsanalyticsservice.model.enums.SportType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PlayerAnalyticsResponse(
        Long id,
        String playerKeycloakId,
        Long teamId,
        SportType sportType,
        LocalDate periodStart,
        LocalDate periodEnd,
        Integer totalMatches,
        Integer primaryScore,
        Integer secondaryScore,
        Double averageRating,
        Integer totalTrainingSessions,
        Integer attendanceRate,
        Integer currentInjuries,
        Double averageFitnessScore,
        Integer fitnessTestsCount,
        String kpiData,
        String sportSpecificStats,
        String trends,
        LocalDateTime calculatedAt,
        String notes
) {}
