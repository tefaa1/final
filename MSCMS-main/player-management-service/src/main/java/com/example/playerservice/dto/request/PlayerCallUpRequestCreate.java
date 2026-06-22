package com.example.playerservice.dto.request;

import com.example.playerservice.dto.validation.Create;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PlayerCallUpRequestCreate(
        @NotBlank(groups = Create.class)
        String playerKeycloakId,

        @NotBlank(groups = Create.class)
        String nationalTeamKeycloakId,

        LocalDate requestDate
) {
}

