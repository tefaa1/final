package com.example.playerservice.model.entity;

import com.example.playerservice.model.enums.Position;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "outer_players")
public class OuterPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dateOfBirth;
    private String nationality;
    private Position preferredPosition;
    private Long marketValue;
    private Integer kitNumber;

    // Forward side of the OuterTeam <-> OuterPlayer pair: keep serialised so
    // the frontend gets `outerTeam.name` inside each outer player row.
    @ManyToOne
    @JoinColumn(name = "outer_team_id")
    private OuterTeam outerTeam;

    // Reverse side of the OuterPlayer <-> PlayerTransferIncoming pair: hide
    // from JSON to avoid Jackson recursing back through outerPlayer.
    @JsonIgnore
    @OneToMany(mappedBy = "outerPlayer", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<PlayerTransferIncoming> playerTransferIncomingSet = new HashSet<>();
}
