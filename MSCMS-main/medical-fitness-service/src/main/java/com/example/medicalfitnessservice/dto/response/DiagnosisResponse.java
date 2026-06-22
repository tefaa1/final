package com.example.medicalfitnessservice.dto.response;

import java.time.LocalDateTime;

public record DiagnosisResponse(
        Long id,
        Long injuryId,
        String playerKeycloakId,
        String doctorKeycloakId,
        String diagnosis,
        String medicalNotes,
        String recommendations,
        LocalDateTime diagnosedAt,
        String testResults,
        String attachments
) {}

