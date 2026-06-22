package com.example.medicalfitnessservice.dto.response;

import com.example.medicalfitnessservice.model.enums.FitnessTestType;
import com.example.medicalfitnessservice.model.enums.SportType;

import java.time.LocalDateTime;

public record FitnessTestResponse(
        Long id,
        String playerKeycloakId,
        Long teamId,
        FitnessTestType testType,
        SportType sportType,
        LocalDateTime testDate,
        String conductedByDoctorKeycloakId,
        String testName,
        Double result,
        String unit,
        String resultCategory,
        String notes,
        String recommendations,
        String attachments
) {}

