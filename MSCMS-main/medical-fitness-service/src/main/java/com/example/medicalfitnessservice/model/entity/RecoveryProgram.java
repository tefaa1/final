package com.example.medicalfitnessservice.model.entity;

import com.example.medicalfitnessservice.model.enums.RecoveryProgramStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "recovery_programs")
public class RecoveryProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "rehabilitation_id")
    private Rehabilitation rehabilitation;

    private Long playerId;
    private Long createdByDoctorId;  // Reference to Doctor/Physiotherapist

    @Enumerated(EnumType.STRING)
    private RecoveryProgramStatus status;

    private String programName;
    private String description;
    private String activities;  // Recovery activities/exercises
    private String nutritionPlan;  // Nutrition recommendations

    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;

    private Integer sessionsPerWeek;
    private Integer durationMinutes;  // Per session duration

    private String progressNotes;
    private String goals;  // Recovery goals
}

