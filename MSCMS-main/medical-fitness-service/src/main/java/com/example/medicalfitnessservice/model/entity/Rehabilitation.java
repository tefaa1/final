package com.example.medicalfitnessservice.model.entity;

import com.example.medicalfitnessservice.model.enums.RehabStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "rehabilitations")
public class Rehabilitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "injury_id")
    private Injury injury;

    private Long playerId;
    private Long physiotherapistId;  // Reference to Physiotherapist

    @Enumerated(EnumType.STRING)
    private RehabStatus status;

    private String rehabPlan;  // Rehabilitation plan description
    private String exercises;  // Prescribed exercises
    private Integer durationWeeks;  // Expected duration in weeks

    private LocalDate startDate;
    private LocalDate expectedEndDate;
    private LocalDate actualEndDate;
    private LocalDateTime createdAt;

    private String progressNotes;
    private String restrictions;  // Activity restrictions

    // Reverse @OneToMany side: hide from JSON so /rehabilitations doesn't
    // loop back through RecoveryProgram.rehabilitation -> recoveryPrograms.
    @JsonIgnore
    @OneToMany(mappedBy = "rehabilitation", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RecoveryProgram> recoveryPrograms = new HashSet<>();
}

