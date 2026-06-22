package com.example.medicalfitnessservice.dto.response;

import com.example.medicalfitnessservice.model.enums.RecoveryProgramStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecoveryProgramResponse(
        Long id,
        Long rehabilitationId,
        Long playerId,
        Long createdByDoctorId,
        RecoveryProgramStatus status,
        String programName,
        String description,
        String activities,
        String nutritionPlan,
        LocalDate startDate,
        LocalDate endDate,
        LocalDateTime createdAt,
        Integer sessionsPerWeek,
        Integer durationMinutes,
        String progressNotes,
        String goals
) {}

