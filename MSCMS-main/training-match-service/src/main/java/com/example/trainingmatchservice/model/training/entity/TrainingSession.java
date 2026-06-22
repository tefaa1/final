package com.example.trainingmatchservice.model.training.entity;

import com.example.trainingmatchservice.model.training.enums.TrainingStatus;
import com.example.trainingmatchservice.model.training.enums.TrainingType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "training_sessions")
public class TrainingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long teamId;

    @Enumerated(EnumType.STRING)
    private TrainingType trainingType;

    @Enumerated(EnumType.STRING)
    private TrainingStatus status;

    private LocalDateTime scheduledDateTime;
    private Integer durationMinutes;
    private String location;

    private Long headCoachId;
    private Long specificCoachId;  // for specialized training

    private String objectives;  // Training goals
    private String description;
    private String notes;  // Post-training notes

    // Reverse @OneToMany sides — hide from JSON so a stray entity
    // serialisation doesn't loop back through each child's
    // @ManyToOne trainingSession. Each collection is exposed via its
    // own endpoint (/training-attendance, /training-drills, etc.).
    @JsonIgnore
    @OneToMany(mappedBy = "trainingSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TrainingAttendance> trainingAttendanceSet = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "trainingSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TrainingDrill> trainingDrillSet = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "trainingSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<PlayerTrainingAssessment> playerTrainingAssessmentSet = new HashSet<>();
}
