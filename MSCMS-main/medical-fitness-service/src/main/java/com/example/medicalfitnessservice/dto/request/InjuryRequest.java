package com.example.medicalfitnessservice.dto.request;

import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.model.enums.InjurySeverity;
import com.example.medicalfitnessservice.model.enums.InjuryStatus;
import com.example.medicalfitnessservice.model.enums.InjuryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record InjuryRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long teamId,

        @NotNull(groups = Create.class)
        InjuryType injuryType,

        @NotNull(groups = Create.class)
        InjurySeverity severity,

        @NotNull(groups = Create.class)
        InjuryStatus status,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String bodyPart,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String description,

        @NotNull(groups = Create.class)
        LocalDate injuryDate,

        @NotNull(groups = Create.class)
        LocalDateTime reportedAt,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long reportedByDoctorId
) {
    public InjuryRequest {
        bodyPart = bodyPart != null ? bodyPart.trim() : null;
        description = description != null ? description.trim() : null;
    }
}

