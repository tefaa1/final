package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.training.enums.DrillCategory;

public record TrainingDrillResponse(
        Long id,
        Long trainingSessionId,
        String drillName,
        String description,
        DrillCategory category,
        Integer durationMinutes,
        Integer orderInSession,
        String equipment,
        String instructions,
        Integer intensity
) {}

