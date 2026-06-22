package com.example.playerservice.model.entity;

import com.example.playerservice.model.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "players_transfers_outgoing")
public class PlayerTransferOutgoing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_keycloak_id")
    private String playerKeycloakId;

    @ManyToOne
    @JoinColumn(name = "from_team_id")
    private Team fromTeam;

    @ManyToOne
    @JoinColumn(name = "to_team_id")
    private OuterTeam toTeam;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private LocalDate requestDate;
}
