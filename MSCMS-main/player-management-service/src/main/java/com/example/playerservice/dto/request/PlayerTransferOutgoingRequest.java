package com.example.playerservice.dto.request;

import com.example.playerservice.dto.validation.Create;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record PlayerTransferOutgoingRequest(
        @NotBlank(groups = Create.class)
        String playerKeycloakId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        Long fromTeamId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        Long toOuterTeamId,

        LocalDate requestDate
) {
}

