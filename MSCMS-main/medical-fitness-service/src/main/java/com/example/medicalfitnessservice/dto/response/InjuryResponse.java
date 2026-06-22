package com.example.medicalfitnessservice.dto.response;

import com.example.medicalfitnessservice.model.enums.InjurySeverity;
import com.example.medicalfitnessservice.model.enums.InjuryStatus;
import com.example.medicalfitnessservice.model.enums.InjuryType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record InjuryResponse(
        Long id,
        Long playerId,
        Long teamId,
        InjuryType injuryType,
        InjurySeverity severity,
        InjuryStatus status,
        String bodyPart,
        String description,
        LocalDate injuryDate,
        LocalDateTime reportedAt,
        Long reportedByDoctorId
) {}

