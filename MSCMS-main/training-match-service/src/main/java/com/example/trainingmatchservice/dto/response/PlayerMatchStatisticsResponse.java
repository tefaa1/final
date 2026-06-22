package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.match.enums.SportType;

public record PlayerMatchStatisticsResponse(
        Long id,
        Long matchId,
        Long playerId,
        SportType sportType,
        Integer minutesPlayed,
        Double performanceRating,

        // Football
        Integer goals,
        Integer assists,
        Integer shots,
        Integer shotsOnTarget,
        Integer dribbles,
        Integer dribblesSuccessful,
        Integer passes,
        Integer passesCompleted,
        Integer keyPasses,
        Integer tackles,
        Integer tacklesWon,
        Integer interceptions,
        Integer clearances,
        Integer foulsCommitted,
        Integer foulsWon,
        Integer yellowCards,
        Integer redCards,

        // Basketball
        Integer points,
        Integer rebounds,
        Integer assistsBasketball,
        Integer steals,
        Integer blocks,
        Integer turnovers,
        Integer fieldGoalsMade,
        Integer fieldGoalAttempts,
        Integer threePointersMade,
        Integer threePointAttempts,
        Integer freeThrowsMade,
        Integer freeThrowAttempts,
        Integer plusMinus,

        // Tennis
        Integer aces,
        Integer doubleFaults,
        Integer firstServeIn,
        Integer firstServePoints,
        Integer breakPointsConverted,
        Integer winners,
        Integer unforcedErrors,
        Integer setsWon,
        Integer gamesWon,

        // Swimming
        Long raceTimeMs,
        String splitTimes,
        Integer strokeCount,
        Integer turnCount,
        Integer laneNumber,
        Boolean disqualified,

        // Volleyball
        Integer spikePoints,
        Integer spikeErrors,
        Integer blockPoints,
        Integer serviceAces,
        Integer serviceErrors,
        Integer receptions,
        Integer receptionErrors,
        Integer digs,

        // Handball
        Integer goalsHandball,
        Integer handballGoalAttempts,
        Integer assistsHandball,
        Integer handballSteals,
        Integer handballTurnovers,
        Integer twoMinuteSuspensions,
        Integer sevenMeterGoals,
        Integer saves
) {}
