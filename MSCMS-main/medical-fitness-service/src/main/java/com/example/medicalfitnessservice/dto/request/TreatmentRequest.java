package com.example.medicalfitnessservice.dto.request;

import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.model.enums.TreatmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TreatmentRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long injuryId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long doctorId,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String treatmentType,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String description,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String medication,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String dosage,

        @NotNull(groups = Create.class)
        TreatmentStatus status,

        @NotNull(groups = Create.class)
        LocalDate startDate,

        LocalDate endDate,

        @NotNull(groups = Create.class)
        LocalDateTime createdAt,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String notes,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String response
) {
    public TreatmentRequest {
        treatmentType = treatmentType != null ? treatmentType.trim() : null;
        description = description != null ? description.trim() : null;
        medication = medication != null ? medication.trim() : null;
        dosage = dosage != null ? dosage.trim() : null;
        notes = notes != null ? notes.trim() : null;
        response = response != null ? response.trim() : null;
    }
}

