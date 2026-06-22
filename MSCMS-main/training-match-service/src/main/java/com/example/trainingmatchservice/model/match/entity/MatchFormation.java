package com.example.trainingmatchservice.model.match.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "matches_formations")
public class MatchFormation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "matchFormation")
    private Set<Match> matches = new HashSet<>();

    private Long teamId;

    @Column(name = "set_by_coach_keycloak_id")
    private String setByCoachKeycloakId;

    private String formation;  // e.g., "4-3-3", "4-4-2"
    private String tacticalApproach;  // e.g., "High Press", "Counter Attack"

    private String formationDetails;

    @OneToMany(mappedBy = "matchFormation", cascade = CascadeType.ALL,orphanRemoval = true)
    private Set<MatchLineup>matchLineupSet = new HashSet<>();
}
