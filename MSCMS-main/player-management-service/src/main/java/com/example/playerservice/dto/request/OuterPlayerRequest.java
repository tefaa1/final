package com.example.playerservice.dto.request;

import com.example.playerservice.dto.validation.Create;
import com.example.playerservice.dto.validation.Update;
import com.example.playerservice.model.enums.Position;
import jakarta.validation.constraints.*;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record OuterPlayerRequest(
        @NotNull(groups = Create.class)
        @Past(groups = {Create.class, Update.class})
        LocalDate dateOfBirth,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String nationality,

        @NotNull(groups = Create.class)
        Position preferredPosition,

        @Min(value = 0, groups = {Create.class, Update.class})
        @NotNull(groups = Create.class)
        Long marketValue,

        @Min(value = 1, groups = {Create.class, Update.class})
        @Max(value = 99, groups = {Create.class, Update.class})
        @NotNull(groups = Create.class)
        Integer kitNumber,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long outerTeamId
) {
    public OuterPlayerRequest {
        nationality = nationality != null ? nationality.trim() : null;
    }
}

