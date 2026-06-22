package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.training.enums.PlanStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TrainingPlanRequest(
        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String title,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String description,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long teamId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long createdByCoachId,

        @NotNull(groups = Create.class)
        LocalDate startDate,

        @NotNull(groups = Create.class)
        LocalDate endDate,

        @NotNull(groups = Create.class)
        PlanStatus status,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String goals,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String focus
) {
    public TrainingPlanRequest {
        title = title != null ? title.trim() : null;
        description = description != null ? description.trim() : null;
        goals = goals != null ? goals.trim() : null;
        focus = focus != null ? focus.trim() : null;
    }
}

