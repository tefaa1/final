package com.example.medicalfitnessservice.model.entity;

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
@Table(name = "training_loads")
public class TrainingLoad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long playerId;
    private Long teamId;
    private Long trainingSessionId;  // Reference to Training Session

    private LocalDate date;

    private Integer durationMinutes;  // Training duration
    private Double intensity;  // Training intensity (0.0 - 1.0 or RPE scale)
    private Double load;  // Calculated load (duration * intensity)
    private Integer distanceKm;  // Distance covered (if applicable)
    private Integer heartRateAvg;  // Average heart rate
    private Integer heartRateMax;  // Maximum heart rate

    private String trainingType;  // e.g., "Cardio", "Strength", "Technical"
    private String notes;
}

