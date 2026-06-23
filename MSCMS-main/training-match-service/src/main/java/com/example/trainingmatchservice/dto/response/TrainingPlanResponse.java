package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.training.enums.PlanStatus;
import com.example.trainingmatchservice.model.training.enums.TrainingType;

import java.time.LocalDate;

public record TrainingPlanResponse(
        Long id,
        String title,
        String description,
        Long teamId,
        Long createdByCoachId,
        LocalDate startDate,
        LocalDate endDate,
        PlanStatus status,
        TrainingType trainingType,
        String sessionSlots,
        String goals,
        String focus
) {}

