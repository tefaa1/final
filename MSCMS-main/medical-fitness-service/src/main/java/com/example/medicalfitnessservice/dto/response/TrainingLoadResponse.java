package com.example.medicalfitnessservice.dto.response;

import java.time.LocalDate;

public record TrainingLoadResponse(
        Long id,
        Long playerId,
        Long teamId,
        Long trainingSessionId,
        LocalDate date,
        Integer durationMinutes,
        Double intensity,
        Double load,
        Integer distanceKm,
        Integer heartRateAvg,
        Integer heartRateMax,
        String trainingType,
        String notes
) {}

