package com.example.trainingmatchservice.model.competition;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "competition_teams")
@Getter
@Setter
@NoArgsConstructor
public class CompetitionTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long competitionId;

    private String name;
    private String shortName;   // exposed as `shortName` (JSON keyword-safe)
    private String crestUrl;
    private String crest;       // emoji fallback
    private String sport;
}
