package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.match.enums.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record MatchEventRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long matchId,

        @NotNull(groups = Create.class)
        String playerKeycloakId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long teamId,

        @NotNull(groups = Create.class)
        EventType eventType,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Integer minute,

        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer extraTime,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String description
) {
    public MatchEventRequest {
        description = description != null ? description.trim() : null;
    }
}

