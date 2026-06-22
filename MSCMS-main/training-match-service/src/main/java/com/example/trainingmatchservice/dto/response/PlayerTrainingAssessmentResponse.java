package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.training.enums.PlayerCondition;

public record PlayerTrainingAssessmentResponse(
        Long id,
        Long trainingSessionId,
        Long playerId,
        Long assessedByCoachId,
        Integer performanceRating,
        Integer effortRating,
        Integer attitudeRating,
        PlayerCondition condition,
        String strengths,
        String areasForImprovement,
        String coachComments
) {}

