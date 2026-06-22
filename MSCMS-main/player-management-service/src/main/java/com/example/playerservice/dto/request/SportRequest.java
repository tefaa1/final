package com.example.playerservice.dto.request;

import com.example.playerservice.dto.validation.Create;
import com.example.playerservice.dto.validation.Update;
import com.example.playerservice.model.enums.SportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record SportRequest(
        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String name,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long sportManagerId,

        @NotNull(groups = Create.class)
        SportType sportType
) {
    public SportRequest {
        name = name != null ? name.trim() : null;
    }
}
