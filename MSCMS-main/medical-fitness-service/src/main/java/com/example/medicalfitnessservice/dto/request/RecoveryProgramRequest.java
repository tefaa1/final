package com.example.medicalfitnessservice.dto.request;

import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.model.enums.RecoveryProgramStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecoveryProgramRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long rehabilitationId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long createdByDoctorId,

        @NotNull(groups = Create.class)
        RecoveryProgramStatus status,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String programName,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String description,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String activities,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String nutritionPlan,

        @NotNull(groups = Create.class)
        LocalDate startDate,

        LocalDate endDate,
        LocalDateTime createdAt,

        @Positive(groups = {Create.class, Update.class})
        Integer sessionsPerWeek,

        @Positive(groups = {Create.class, Update.class})
        Integer durationMinutes,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String progressNotes,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String goals
) {
    public RecoveryProgramRequest {
        programName = programName != null ? programName.trim() : null;
        description = description != null ? description.trim() : null;
        activities = activities != null ? activities.trim() : null;
        nutritionPlan = nutritionPlan != null ? nutritionPlan.trim() : null;
        progressNotes = progressNotes != null ? progressNotes.trim() : null;
        goals = goals != null ? goals.trim() : null;
    }
}