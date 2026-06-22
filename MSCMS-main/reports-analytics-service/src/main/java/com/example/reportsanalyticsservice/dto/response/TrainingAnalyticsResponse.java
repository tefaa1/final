package com.example.reportsanalyticsservice.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TrainingAnalyticsResponse(
        Long id,
        Long teamId,
        String playerKeycloakId,
        LocalDate periodStart,
        LocalDate periodEnd,
        Integer totalSessions,
        Integer attendedSessions,
        Integer missedSessions,
        Double attendanceRate,
        Double averageTrainingLoad,
        Double averagePerformanceScore,
        Integer injuriesDuringPeriod,
        String kpiData,
        String trends,
        LocalDateTime calculatedAt,
        String notes
) {}
