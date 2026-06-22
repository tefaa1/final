package com.example.trainingmatchservice.model.training.entity;

import com.example.trainingmatchservice.model.training.enums.PlanStatus;
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

    private String goals;  // Overall plan objectives
    private String focus;  // e.g., "Pre-season preparation"
}
