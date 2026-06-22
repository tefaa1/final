package com.example.playerservice.dto.request;

import com.example.playerservice.dto.validation.Create;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record PlayerTransferIncomingRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        Long outerPlayerId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        Long fromOuterTeamId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        Long toTeamId,

        LocalDate requestDate
) {
}

