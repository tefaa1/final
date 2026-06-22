package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.training.enums.TrainingStatus;
import com.example.trainingmatchservice.model.training.enums.TrainingType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public record TrainingSessionRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long teamId,

        @NotNull(groups = Create.class)
        TrainingType trainingType,

        @NotNull(groups = Create.class)
        TrainingStatus status,

        @NotNull(groups = Create.class)
        LocalDateTime scheduledDateTime,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Integer durationMinutes,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String location,

        @Positive(groups = {Create.class, Update.class})
        Long headCoachId,

        @Positive(groups = {Create.class, Update.class})
        Long specificCoachId,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String objectives,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String description,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String notes
) {
    public TrainingSessionRequest {
        location = location != null ? location.trim() : null;
        objectives = objectives != null ? objectives.trim() : null;
        description = description != null ? description.trim() : null;
        notes = notes != null ? notes.trim() : null;
    }
}

