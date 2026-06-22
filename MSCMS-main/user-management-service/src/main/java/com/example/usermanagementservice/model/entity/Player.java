package com.example.usermanagementservice.model.entity;

import com.example.usermanagementservice.model.enums.Position;
import com.example.usermanagementservice.model.enums.StatusOfPlayer;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
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
@Table(name = "players")
public class Player extends User {


    private LocalDate dateOfBirth;
    private String nationality;
    private Position preferredPosition;
    private Long marketValue;
    private Integer kitNumber; // from 1 to 99 handle in request dto

    @jakarta.persistence.Column(length = 1000)
    private String photoUrl;

    private Long rosterId;

    private Long contractId;

    @Enumerated(EnumType.STRING)
    private StatusOfPlayer status;
}
