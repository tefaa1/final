package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.training.enums.PlanStatus;

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
        String goals,
        String focus
) {}

