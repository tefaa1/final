package com.example.trainingmatchservice.dto.response;

public record MatchPerformanceReviewResponse(
        Long id,
        Long matchId,
        Long reviewedByCoachId,
        Long playerId,
        String tacticalAnalysis,
        String strengths,
        String weaknesses,
        String areasForImprovement,
        Integer overallPerformanceRating
) {}

