package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.match.enums.SportType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record PlayerMatchStatisticsRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long matchId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotNull(groups = Create.class)
        SportType sportType,

        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer minutesPlayed,

        @Min(value = 0, groups = {Create.class, Update.class})
        @Max(value = 10, groups = {Create.class, Update.class})
        Double performanceRating,

        // Football
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer goals,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer assists,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer shots,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer shotsOnTarget,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer dribbles,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer dribblesSuccessful,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer passes,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer passesCompleted,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer keyPasses,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer tackles,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer tacklesWon,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer interceptions,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer clearances,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer foulsCommitted,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer foulsWon,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer yellowCards,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer redCards,

        // Basketball
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer points,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer rebounds,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer assistsBasketball,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer steals,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer blocks,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer turnovers,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer fieldGoalsMade,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer fieldGoalAttempts,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer threePointersMade,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer threePointAttempts,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer freeThrowsMade,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer freeThrowAttempts,
        Integer plusMinus,

        // Tennis
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer aces,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer doubleFaults,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer firstServeIn,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer firstServePoints,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer breakPointsConverted,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer winners,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer unforcedErrors,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer setsWon,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer gamesWon,

        // Swimming
        @PositiveOrZero(groups = {Create.class, Update.class})
        Long raceTimeMs,
        String splitTimes,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer strokeCount,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer turnCount,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer laneNumber,
        Boolean disqualified,

        // Volleyball
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer spikePoints,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer spikeErrors,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer blockPoints,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer serviceAces,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer serviceErrors,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer receptions,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer receptionErrors,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer digs,

        // Handball
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer goalsHandball,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer handballGoalAttempts,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer assistsHandball,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer handballSteals,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer handballTurnovers,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer twoMinuteSuspensions,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer sevenMeterGoals,
        @PositiveOrZero(groups = {Create.class, Update.class})
        Integer saves
) {}
