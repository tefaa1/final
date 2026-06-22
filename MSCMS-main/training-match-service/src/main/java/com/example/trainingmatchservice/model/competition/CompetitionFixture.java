package com.example.trainingmatchservice.model.competition;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One fixture in a competition. For a LEAGUE these are pre-generated as a full
 * round-robin (each pair home & away) so the table can only be filled with the
 * real fixtures — never the same pairing over and over.
 */
@Entity
@Table(name = "competition_fixtures")
@Getter
@Setter
@NoArgsConstructor
public class CompetitionFixture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long competitionId;

    private Long homeTeamId;
    private Long awayTeamId;
    private String homeName;   // denormalised for easy rendering
    private String awayName;

    private Integer homeScore;
    private Integer awayScore;
    private Boolean played = false;

    private String round;      // knockout: GROUP/R16/QF/SF/FINAL ; league: ""
    private String groupName;  // knockout group letter
    private Integer matchday;  // league matchday

    private LocalDateTime playedAt;
}
