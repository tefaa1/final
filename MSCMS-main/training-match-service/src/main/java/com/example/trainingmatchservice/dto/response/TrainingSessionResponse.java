package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.training.enums.TrainingStatus;
import com.example.trainingmatchservice.model.training.enums.TrainingType;

import java.time.LocalDateTime;

public record TrainingSessionResponse(
        Long id,
        Long teamId,
        TrainingType trainingType,
        TrainingStatus status,
        LocalDateTime scheduledDateTime,
        Integer durationMinutes,
        String location,
        Long headCoachId,
        Long specificCoachId,
        String objectives,
        String description,
        String notes
) {}

