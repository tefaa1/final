package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.match.enums.LineupStatus;
import com.example.trainingmatchservice.model.match.enums.Position;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MatchLineupRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long teamId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long matchFormationId,

        @NotNull(groups = Create.class)
        LineupStatus lineupStatus,

        @NotNull(groups = Create.class)
        Position position,

        @NotNull(groups = Create.class)
        @Min(value = 1, groups = {Create.class, Update.class})
        @Max(value = 99, groups = {Create.class, Update.class})
        Integer jerseyNumber,

        Boolean wasSubstituted,

        @Positive(groups = {Create.class, Update.class})
        Integer substitutionMinute,

        @Positive(groups = {Create.class, Update.class})
        Long substitutedByPlayerId
) {}

