package com.example.playerservice.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "tables")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String name;

    private String country;

    // Forward side of Team <-> Sport: keep serialised so the frontend gets
    // team.sport.sportType (used by the Sport Distribution pie and badges).
    @ManyToOne
    @JoinColumn(name = "sport_id")
    private Sport sport;

    // Reverse side of Team <-> Roster: hide from JSON to avoid recursing
    // back through Roster.team. The Rosters endpoint exposes them directly.
    @JsonIgnore
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Roster> rosters = new HashSet<>();


}
