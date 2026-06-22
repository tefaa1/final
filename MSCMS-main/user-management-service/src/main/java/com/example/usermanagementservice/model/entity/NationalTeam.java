package com.example.usermanagementservice.model.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "national_team_profile")
public class NationalTeam extends User {

    private String federationName;
    private String contactPerson;
    private String country;

}
