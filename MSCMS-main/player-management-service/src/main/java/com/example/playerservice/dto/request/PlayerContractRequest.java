package com.example.playerservice.dto.request;

import com.example.playerservice.dto.validation.Create;
import com.example.playerservice.dto.validation.Update;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PlayerContractRequest(
        @NotBlank(groups = Create.class)
        String playerKeycloakId,

        @NotNull(groups = Create.class)
        LocalDate startDate,

        @NotNull(groups = Create.class)
        LocalDate endDate,

        @Min(value = 0, groups = {Create.class, Update.class})
        @NotNull(groups = Create.class)
        Long salary,

        @Min(value = 0, groups = {Create.class, Update.class})
        @NotNull(groups = Create.class)
        Long releaseClause
) {
}

