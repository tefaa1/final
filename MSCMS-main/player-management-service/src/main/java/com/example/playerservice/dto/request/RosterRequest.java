package com.example.playerservice.dto.request;

import com.example.playerservice.dto.validation.Create;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;

public record RosterRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        Long playerId,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        String season,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        Long teamId
) {
    public RosterRequest {
        season = season != null ? season.trim() : null;
    }
}

