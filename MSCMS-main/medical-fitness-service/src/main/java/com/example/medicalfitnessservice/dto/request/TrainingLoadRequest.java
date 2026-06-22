package com.example.medicalfitnessservice.dto.request;

import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TrainingLoadRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long teamId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long trainingSessionId,

        @NotNull(groups = Create.class)
        LocalDate date,

        @Positive(groups = {Create.class, Update.class})
        Integer durationMinutes,

        @PositiveOrZero(groups = {Create.class, Update.class})
        Double intensity,

        @PositiveOrZero(groups = {Create.class, Update.class})
        Double load,

        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer distanceKm,

        @Positive(groups = {Create.class, Update.class})
        Integer heartRateAvg,

        @Positive(groups = {Create.class, Update.class})
        Integer heartRateMax,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String trainingType,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String notes
) {
    public TrainingLoadRequest {
        trainingType = trainingType != null ? trainingType.trim() : null;
        notes = notes != null ? notes.trim() : null;
    }
}

