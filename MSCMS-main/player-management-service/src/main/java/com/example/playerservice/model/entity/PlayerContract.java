package com.example.playerservice.model.entity;

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
@Table(name = "players_contracts")
public class PlayerContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_keycloak_id")
    private String playerKeycloakId;

    private LocalDate startDate;
    private LocalDate endDate;
    private Long salary;
    private Long releaseClause; // if a team wants to buy this player before the contract ends should pay this
}
