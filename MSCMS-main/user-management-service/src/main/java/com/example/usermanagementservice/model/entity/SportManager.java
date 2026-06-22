package com.example.usermanagementservice.model.entity;

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
@Table(name = "sport_manager")
public class SportManager extends User{

    private Long sportId;

    private Boolean canManageAllTeams = true;

    @OneToMany(mappedBy = "sportManager",cascade = {CascadeType.PERSIST,CascadeType.MERGE})
    private Set<TeamManager> teamManagerSet = new HashSet<>();
}
