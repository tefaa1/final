package com.example.medicalfitnessservice.dto.request;

import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.model.enums.FitnessTestType;
import com.example.medicalfitnessservice.model.enums.SportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record FitnessTestRequest(
        @NotBlank(groups = Create.class)
        String playerKeycloakId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long teamId,

        @NotNull(groups = Create.class)
        FitnessTestType testType,

        @NotNull(groups = Create.class)
        SportType sportType,

        @NotNull(groups = Create.class)
        LocalDateTime testDate,

        @NotBlank(groups = Create.class)
        String conductedByDoctorKeycloakId,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String testName,

        @Positive(groups = {Create.class, Update.class})
        Double result,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String unit,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String resultCategory,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String notes,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String recommendations,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String attachments
) {
    public FitnessTestRequest {
        playerKeycloakId = playerKeycloakId != null ? playerKeycloakId.trim() : null;
        conductedByDoctorKeycloakId = conductedByDoctorKeycloakId != null ? conductedByDoctorKeycloakId.trim() : null;
        testName = testName != null ? testName.trim() : null;
        unit = unit != null ? unit.trim() : null;
        resultCategory = resultCategory != null ? resultCategory.trim() : null;
        notes = notes != null ? notes.trim() : null;
        recommendations = recommendations != null ? recommendations.trim() : null;
        attachments = attachments != null ? attachments.trim() : null;
    }
}
