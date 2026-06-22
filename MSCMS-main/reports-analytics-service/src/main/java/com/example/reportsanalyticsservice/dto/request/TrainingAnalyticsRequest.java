package com.example.reportsanalyticsservice.dto.request;

import com.example.reportsanalyticsservice.dto.validation.Create;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TrainingAnalyticsRequest(
        @NotNull(groups = Create.class) @Positive(groups = Create.class) Long teamId,
        String playerKeycloakId,
        @NotNull(groups = Create.class) LocalDate periodStart,
        @NotNull(groups = Create.class) LocalDate periodEnd,
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
