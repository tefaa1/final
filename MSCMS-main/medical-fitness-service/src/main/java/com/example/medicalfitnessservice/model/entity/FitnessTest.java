package com.example.medicalfitnessservice.model.entity;

import com.example.medicalfitnessservice.model.enums.FitnessTestType;
import com.example.medicalfitnessservice.model.enums.SportType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "fitness_tests")
public class FitnessTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_keycloak_id")
    private String playerKeycloakId;

    private Long teamId;

    @Enumerated(EnumType.STRING)
    private FitnessTestType testType;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private LocalDateTime testDate;

    @Column(name = "conducted_by_doctor_keycloak_id")
    private String conductedByDoctorKeycloakId;  // Reference to Doctor/Fitness Coach

    private String testName;  // Specific test name
    private Double result;  // Test result value
    private String unit;  // e.g., "km/h", "seconds", "kg"
    private String resultCategory;  // e.g., "Excellent", "Good", "Average", "Poor"

    private String notes;
    private String recommendations;
    private String attachments;  // File references for test reports
}

