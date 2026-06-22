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
@Table(name = "player_analytics")
public class PlayerAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String playerKeycloakId;
    private Long teamId;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private LocalDate periodStart;
    private LocalDate periodEnd;

    // Generic performance metrics
    private Integer totalMatches;
    private Integer primaryScore;    // goals (football), points (basketball), sets won (tennis), etc.
    private Integer secondaryScore;  // assists (football), rebounds (basketball), break points (tennis), etc.
    private Double averageRating;
    private Integer totalTrainingSessions;
    private Integer attendanceRate;

    // Fitness Metrics
    private Integer currentInjuries;
    private Double averageFitnessScore;
    private Integer fitnessTestsCount;

    // KPI Metrics
    private String kpiData;
    private String sportSpecificStats; // JSON for additional sport-specific metrics
    private String trends;

    private LocalDateTime calculatedAt;
    private String notes;
}
