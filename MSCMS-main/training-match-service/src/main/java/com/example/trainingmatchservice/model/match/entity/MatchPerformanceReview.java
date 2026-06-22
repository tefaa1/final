package com.example.trainingmatchservice.model.match.entity;

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
@Table(name = "matches_lineups")
public class MatchPerformanceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;

    private Long reviewedByCoachId;
    private Long playerId;

    private String tacticalAnalysis;
    private String strengths;
    private String weaknesses;
    private String areasForImprovement;

    private Integer overallPerformanceRating;
}
