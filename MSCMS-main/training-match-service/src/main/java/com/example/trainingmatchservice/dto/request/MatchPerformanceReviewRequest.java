package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record MatchPerformanceReviewRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long matchId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long reviewedByCoachId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String tacticalAnalysis,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String strengths,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String weaknesses,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String areasForImprovement,

        @Positive(groups = {Create.class, Update.class})
        Integer overallPerformanceRating
) {
    public MatchPerformanceReviewRequest {
        tacticalAnalysis = tacticalAnalysis != null ? tacticalAnalysis.trim() : null;
        strengths = strengths != null ? strengths.trim() : null;
        weaknesses = weaknesses != null ? weaknesses.trim() : null;
        areasForImprovement = areasForImprovement != null ? areasForImprovement.trim() : null;
    }
}

