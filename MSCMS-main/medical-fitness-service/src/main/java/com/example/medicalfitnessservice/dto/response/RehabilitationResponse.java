package com.example.medicalfitnessservice.dto.response;

import com.example.medicalfitnessservice.model.enums.RehabStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RehabilitationResponse(
        Long id,
        Long injuryId,
        Long playerId,
        Long physiotherapistId,
        RehabStatus status,
        String rehabPlan,
        String exercises,
        Integer durationWeeks,
        LocalDate startDate,
        LocalDate expectedEndDate,
        LocalDate actualEndDate,
        LocalDateTime createdAt,
        String progressNotes,
        String restrictions
) {}

