package com.example.medicalfitnessservice.dto.request;

import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.model.enums.RehabStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RehabilitationRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long injuryId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long physiotherapistId,

        @NotNull(groups = Create.class)
        RehabStatus status,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String rehabPlan,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String exercises,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Integer durationWeeks,

        @NotNull(groups = Create.class)
        LocalDate startDate,

        LocalDate expectedEndDate,
        LocalDate actualEndDate,
        LocalDateTime createdAt,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String progressNotes,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String restrictions
) {
    public RehabilitationRequest {
        rehabPlan = rehabPlan != null ? rehabPlan.trim() : null;
        exercises = exercises != null ? exercises.trim() : null;
        progressNotes = progressNotes != null ? progressNotes.trim() : null;
        restrictions = restrictions != null ? restrictions.trim() : null;
    }
}

