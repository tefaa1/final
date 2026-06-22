package com.example.playerservice.model.entity;

import com.example.playerservice.model.enums.SportType;
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
@Table(name = "sports")
public class Sport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Long sportManagerId;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    // Reverse side of Sport <-> Team: hide from JSON so the Teams endpoint
    // can safely serialise team.sport (which would otherwise loop back
    // through sport.teams and explode Jackson).
    @JsonIgnore
    @OneToMany(mappedBy = "sport", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Team> teams = new HashSet<>();
}
