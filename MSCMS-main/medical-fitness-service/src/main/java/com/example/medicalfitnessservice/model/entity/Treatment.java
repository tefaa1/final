package com.example.medicalfitnessservice.model.entity;

import com.example.medicalfitnessservice.model.enums.TreatmentStatus;
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
@Table(name = "treatments")
public class Treatment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "injury_id")
    private Injury injury;

    private Long playerId;
    private Long doctorId;  // Reference to Doctor

    private String treatmentType;  // e.g., "Medication", "Physiotherapy", "Surgery"
    private String description;
    private String medication;  // If applicable
    private String dosage;  // If applicable

    @Enumerated(EnumType.STRING)
    private TreatmentStatus status;

    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;

    private String notes;
    private String response;  // Player's response to treatment
}

