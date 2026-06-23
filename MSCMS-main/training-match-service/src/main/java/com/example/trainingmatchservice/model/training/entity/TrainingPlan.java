package com.example.trainingmatchservice.model.training.entity;

import com.example.trainingmatchservice.model.training.enums.PlanStatus;
import com.example.trainingmatchservice.model.training.enums.TrainingType;
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
@Table(name = "training_plans")
public class TrainingPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;

    private Long teamId;
    private Long createdByCoachId;  // Reference to Coach

    private LocalDate startDate;
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private PlanStatus status;

    // The plan's training type — a session can only be attached if its type matches.
    @Enumerated(EnumType.STRING)
    private TrainingType trainingType;

    // Lightweight session slots created with the plan, stored as JSON:
    // [{"name":"Session 1","date":"2026-07-02","sessionId":null}, ...]
    // A slot's "done" flag is derived on the client from its session's status.
    @Column(columnDefinition = "TEXT")
    private String sessionSlots;

    private String goals;  // Overall plan objectives
    private String focus;  // e.g., "Pre-season preparation"
}
