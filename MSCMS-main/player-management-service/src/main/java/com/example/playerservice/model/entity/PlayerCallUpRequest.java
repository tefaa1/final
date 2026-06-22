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
@Table(name = "players-call-up-requests")
public class PlayerCallUpRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_keycloak_id")
    private String playerKeycloakId;

    @Column(name = "national_team_keycloak_id")
    private String nationalTeamKeycloakId;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private LocalDate requestDate;
}
