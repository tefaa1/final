package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.training.enums.PlayerCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record PlayerTrainingAssessmentRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long trainingSessionId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long assessedByCoachId,

        @NotNull(groups = Create.class)
        @Min(value = 1, groups = {Create.class, Update.class})
        @Max(value = 10, groups = {Create.class, Update.class})
        Integer performanceRating,

        @NotNull(groups = Create.class)
        @Min(value = 1, groups = {Create.class, Update.class})
        @Max(value = 10, groups = {Create.class, Update.class})
        Integer effortRating,

        @NotNull(groups = Create.class)
        @Min(value = 1, groups = {Create.class, Update.class})
        @Max(value = 10, groups = {Create.class, Update.class})
        Integer attitudeRating,

        @NotNull(groups = Create.class)
        PlayerCondition condition,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String strengths,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String areasForImprovement,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String coachComments
) {
    public PlayerTrainingAssessmentRequest {
        strengths = strengths != null ? strengths.trim() : null;
        areasForImprovement = areasForImprovement != null ? areasForImprovement.trim() : null;
        coachComments = coachComments != null ? coachComments.trim() : null;
    }
}

