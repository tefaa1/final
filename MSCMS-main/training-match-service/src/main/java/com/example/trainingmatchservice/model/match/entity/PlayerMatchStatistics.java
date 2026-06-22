package com.example.trainingmatchservice.model.match.entity;

import com.example.trainingmatchservice.model.match.enums.SportType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "players_matches_statistics")
public class PlayerMatchStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;

    private Long playerId;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private Integer minutesPlayed;
    private Double performanceRating;

    // Football stats
    private Integer goals;
    private Integer assists;
    private Integer shots;
    private Integer shotsOnTarget;
    private Integer dribbles;
    private Integer dribblesSuccessful;
    private Integer passes;
    private Integer passesCompleted;
    private Integer keyPasses;
    private Integer tackles;
    private Integer tacklesWon;
    private Integer interceptions;
    private Integer clearances;
    private Integer foulsCommitted;
    private Integer foulsWon;
    private Integer yellowCards;
    private Integer redCards;

    // Basketball stats
    private Integer points;
    private Integer rebounds;
    private Integer assistsBasketball;
    private Integer steals;
    private Integer blocks;
    private Integer turnovers;
    private Integer fieldGoalsMade;
    private Integer fieldGoalAttempts;
    private Integer threePointersMade;
    private Integer threePointAttempts;
    private Integer freeThrowsMade;
    private Integer freeThrowAttempts;
    private Integer plusMinus;

    // Tennis stats
    private Integer aces;
    private Integer doubleFaults;
    private Integer firstServeIn;
    private Integer firstServePoints;
    private Integer breakPointsConverted;
    private Integer winners;
    private Integer unforcedErrors;
    private Integer setsWon;
    private Integer gamesWon;

    // Swimming stats
    private Long raceTimeMs;
    private String splitTimes;
    private Integer strokeCount;
    private Integer turnCount;
    private Integer laneNumber;
    private Boolean disqualified;

    // Volleyball stats
    private Integer spikePoints;
    private Integer spikeErrors;
    private Integer blockPoints;
    private Integer serviceAces;
    private Integer serviceErrors;
    private Integer receptions;
    private Integer receptionErrors;
    private Integer digs;

    // Handball stats
    private Integer goalsHandball;
    private Integer handballGoalAttempts;
    private Integer assistsHandball;
    private Integer handballSteals;
    private Integer handballTurnovers;
    private Integer twoMinuteSuspensions;
    private Integer sevenMeterGoals;
    private Integer saves;
}
