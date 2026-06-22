package com.example.trainingmatchservice.model.training.entity;

import com.example.trainingmatchservice.model.training.enums.DrillCategory;
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
@Table(name = "training_drills")
public class TrainingDrill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "training_session_id")
    private TrainingSession trainingSession;

    private String drillName;
    private String description;

    @Enumerated(EnumType.STRING)
    private DrillCategory category;

    private Integer durationMinutes;
    private Integer orderInSession;  // Sequence in the session

    private String equipment;  // Required equipment
    private String instructions;
    private Integer intensity;  // 1-10 scale
}
