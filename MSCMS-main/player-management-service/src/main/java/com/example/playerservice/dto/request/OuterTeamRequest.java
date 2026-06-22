package com.example.playerservice.dto.request;

import com.example.playerservice.dto.validation.Create;
import com.example.playerservice.dto.validation.Update;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OuterTeamRequest(
        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String name,

        @Email(groups = {Create.class, Update.class})
        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String email,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String country
) {
    public OuterTeamRequest {
        name = name != null ? name.trim() : null;
        email = email != null ? email.trim() : null;
        country = country != null ? country.trim() : null;
    }
}

