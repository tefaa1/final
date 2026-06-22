package com.example.trainingmatchservice.model.match.entity;

import com.example.trainingmatchservice.model.match.enums.LineupStatus;
import com.example.trainingmatchservice.model.match.enums.Position;
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
public class MatchLineup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private Long teamId;

    private Long playerId;

    @Column(name = "player_keycloak_id")
    private String playerKeycloakId;

    @ManyToOne
    @JoinColumn(name = "match_formation_id")
    private MatchFormation matchFormation;

    @Enumerated(EnumType.STRING)
    private LineupStatus lineupStatus;

    @Enumerated(EnumType.STRING)
    private Position position;  // e.g., "GK", "CB", "LW"

    private Integer jerseyNumber; // رقم اللاعب على الزي الرسمي

    // If substituted
    private Boolean wasSubstituted;
    private Integer substitutionMinute;
    private Long substitutedByPlayerId;


}
