package com.example.medicalfitnessservice.model.entity;

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
@Table(name = "diagnoses")
public class Diagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "injury_id")
    private Injury injury;

    @Column(name = "player_keycloak_id")
    private String playerKeycloakId;

    @Column(name = "doctor_keycloak_id")
    private String doctorKeycloakId;  // Reference to Doctor

    private String diagnosis;  // Medical diagnosis description
    private String medicalNotes;
    private String recommendations;

    private LocalDateTime diagnosedAt;

    private String testResults;  // e.g., MRI results, X-ray findings
    private String attachments;  // File references (stored externally)
}

