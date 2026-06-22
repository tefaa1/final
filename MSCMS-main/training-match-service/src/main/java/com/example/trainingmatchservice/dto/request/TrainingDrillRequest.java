package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.training.enums.DrillCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.*;

public record TrainingDrillRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long trainingSessionId,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String drillName,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String description,

        @NotNull(groups = Create.class)
        DrillCategory category,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Integer durationMinutes,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Integer orderInSession,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String equipment,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String instructions,

        @Min(value = 1, groups = {Create.class, Update.class})
        @Max(value = 10, groups = {Create.class, Update.class})
        Integer intensity
) {
    public TrainingDrillRequest {
        drillName = drillName != null ? drillName.trim() : null;
        description = description != null ? description.trim() : null;
        equipment = equipment != null ? equipment.trim() : null;
        instructions = instructions != null ? instructions.trim() : null;
    }
}

