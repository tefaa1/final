package com.example.trainingmatchservice.model.match.entity;

import com.example.trainingmatchservice.model.match.enums.MatchStatus;
import com.example.trainingmatchservice.model.match.enums.MatchType;
import com.example.trainingmatchservice.model.match.enums.SportType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long homeTeamId;  // Reference to Team
    private Long OuterTeamId;  // Reference to the Outer Team

    // ─── External ingestion (football-data.org) ───────────────────────────
    @Column(unique = true)
    private Long externalId;       // football-data.org match id (dedup key)
    private String opponentName;   // denormalised opponent for synced matches
    @Column(length = 1000)
    private String opponentCrest;  // opponent logo URL

    @Enumerated(EnumType.STRING)
    private MatchType matchType;

    @Enumerated(EnumType.STRING)
    private MatchStatus status;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private String venue;  // // e.g., Camp Nou
    private String competition;  // e.g., "Premier League"
    private String season;  // e.g., "2024/2025"

    private Integer homeTeamScore;
    private Integer awayTeamScore;

    private LocalDateTime kickoffTime;
    private LocalDateTime finishTime;

    private String referee; // الحكم
    private Integer attendance;  // Number of spectators

    private String matchSummary;
    private String notes;

    @ManyToOne
    @JoinColumn(name = "match_formation_id")
    private MatchFormation matchFormation;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<MatchEvent> matchEvents = new HashSet<>();

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<PlayerMatchStatistics>playerMatchStatisticsSet = new HashSet<>();

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<MatchPerformanceReview>matchPerformanceReviewSet = new HashSet<>();
}
