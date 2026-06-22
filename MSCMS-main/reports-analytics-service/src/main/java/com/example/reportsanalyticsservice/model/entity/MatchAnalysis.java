package com.example.reportsanalyticsservice.model.entity;

import com.example.reportsanalyticsservice.model.enums.SportType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "match_analyses")
public class MatchAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long matchId;
    private Long teamId;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    // Sport-specific stats stored as JSON (e.g. football: possession/shots; basketball: fieldGoalPct/rebounds)
    private String sportSpecificStats;

    // Heatmap Metadata
    private String heatmapFilePath;
    private String heatmapType;

    // Analysis Data
    private String keyMoments;
    private String tacticalAnalysis;
    private String playerRatings;

    private String analyzedByUserKeycloakId;
    private LocalDateTime analyzedAt;

    private String notes;
    private String attachments;
}
