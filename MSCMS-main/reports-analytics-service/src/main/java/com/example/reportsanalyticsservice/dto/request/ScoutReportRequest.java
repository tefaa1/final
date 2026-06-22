package com.example.reportsanalyticsservice.dto.request;

import com.example.reportsanalyticsservice.dto.validation.Create;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record ScoutReportRequest(
        @NotBlank(groups = Create.class) String scoutKeycloakId,
        Long outerPlayerId,
        @Min(1) @Max(10) Integer technicalRating,
        @Min(1) @Max(10) Integer physicalRating,
        @Min(1) @Max(10) Integer tacticalRating,
        @Min(1) @Max(10) Integer mentalityRating,
        String strengths,
        String weaknesses,
        String overallAssessment,
        Boolean recommendSigning,
        LocalDateTime createdAt
) {}
