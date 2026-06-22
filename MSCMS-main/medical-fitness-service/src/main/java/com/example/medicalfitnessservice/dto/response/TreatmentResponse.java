package com.example.medicalfitnessservice.dto.response;

import com.example.medicalfitnessservice.model.enums.TreatmentStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TreatmentResponse(
        Long id,
        Long injuryId,
        Long playerId,
        Long doctorId,
        String treatmentType,
        String description,
        String medication,
        String dosage,
        TreatmentStatus status,
        LocalDate startDate,
        LocalDate endDate,
        LocalDateTime createdAt,
        String notes,
        String response
) {}

