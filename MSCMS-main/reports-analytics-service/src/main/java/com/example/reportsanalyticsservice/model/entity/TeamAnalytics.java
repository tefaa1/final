package com.example.reportsanalyticsservice.model.entity;

import com.example.reportsanalyticsservice.model.enums.SportType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "team_analytics")
public class TeamAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long teamId;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private LocalDate periodStart;
    private LocalDate periodEnd;

    // Match statistics
    private Integer totalMatches;
    private Integer wins;
    private Integer draws;
    private Integer losses;

    // Generic scoring (goals in football, points in basketball, sets in tennis, etc.)
    private Integer pointsFor;
    private Integer pointsAgainst;

    // Training influence
    private Double averageTeamFitnessScore;
    private Integer totalInjuries;
    private Integer totalTrainingSessions;

    // KPIs and sport-specific stats (stored as JSON)
    private String kpiData;
    private String sportSpecificStats;
    private String trends;

    private LocalDateTime calculatedAt;
    private String notes;
}
