package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record MatchFormationRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long teamId,

        @NotNull(groups = Create.class)
        String setByCoachKeycloakId,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String formation,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String tacticalApproach,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String formationDetails
) {
    public MatchFormationRequest {
        formation = formation != null ? formation.trim() : null;
        tacticalApproach = tacticalApproach != null ? tacticalApproach.trim() : null;
        formationDetails = formationDetails != null ? formationDetails.trim() : null;
    }
}

