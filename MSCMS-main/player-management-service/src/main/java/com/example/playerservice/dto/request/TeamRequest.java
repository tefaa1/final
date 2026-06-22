package com.example.playerservice.dto.request;

import com.example.playerservice.dto.validation.Create;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;

public record TeamRequest(
        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        String name,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        String country,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, com.example.playerservice.dto.validation.Update.class})
        Long sportId
) {
    public TeamRequest {
        name = name != null ? name.trim() : null;
        country = country != null ? country.trim() : null;
    }
}

