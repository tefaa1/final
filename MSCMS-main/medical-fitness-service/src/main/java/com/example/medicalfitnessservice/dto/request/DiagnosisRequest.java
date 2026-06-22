package com.example.medicalfitnessservice.dto.request;

import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record DiagnosisRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long injuryId,

        @NotBlank(groups = Create.class)
        String playerKeycloakId,

        @NotBlank(groups = Create.class)
        String doctorKeycloakId,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String diagnosis,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String medicalNotes,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String recommendations,

        @NotNull(groups = Create.class)
        LocalDateTime diagnosedAt,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String testResults,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String attachments
) {
    public DiagnosisRequest {
        playerKeycloakId = playerKeycloakId != null ? playerKeycloakId.trim() : null;
        doctorKeycloakId = doctorKeycloakId != null ? doctorKeycloakId.trim() : null;
        diagnosis = diagnosis != null ? diagnosis.trim() : null;
        medicalNotes = medicalNotes != null ? medicalNotes.trim() : null;
        recommendations = recommendations != null ? recommendations.trim() : null;
        testResults = testResults != null ? testResults.trim() : null;
        attachments = attachments != null ? attachments.trim() : null;
    }
}

