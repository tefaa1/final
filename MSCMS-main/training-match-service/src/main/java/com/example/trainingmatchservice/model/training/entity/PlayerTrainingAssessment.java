package com.example.trainingmatchservice.model.training.entity;

import com.example.trainingmatchservice.model.training.enums.PlayerCondition;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "players_trainings_assessments")
public class PlayerTrainingAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "training_session_id")
    private TrainingSession trainingSession;

    private Long playerId;
    private Long assessedByCoachId;

    private Integer performanceRating;  // 1-10
    private Integer effortRating;  // 1-10
    private Integer attitudeRating;  // 1-10

    @Enumerated(EnumType.STRING)
    private PlayerCondition condition;

    private String strengths;
    private String areasForImprovement;
    private String coachComments;
}
