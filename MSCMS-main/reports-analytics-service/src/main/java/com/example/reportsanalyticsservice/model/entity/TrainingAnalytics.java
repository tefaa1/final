package com.example.reportsanalyticsservice.model.entity;

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
@Table(name = "training_analytics")
public class TrainingAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long teamId;
    private String playerKeycloakId;   // nullable - for team-wide analytics when null

    private LocalDate periodStart;
    private LocalDate periodEnd;

    // Training stats
    private Integer totalSessions;
    private Integer attendedSessions;
    private Integer missedSessions;

    private Double attendanceRate;  // percentage
    private Double averageTrainingLoad;  // from fitness data
    private Double averagePerformanceScore; // trainer rating

    // Injuries relation
    private Integer injuriesDuringPeriod;

    // KPIs (JSON)
    private String kpiData;
    private String trends;

    private LocalDateTime calculatedAt;
    private String notes;
}
