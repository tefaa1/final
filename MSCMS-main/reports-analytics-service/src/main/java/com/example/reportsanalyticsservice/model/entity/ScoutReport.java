package com.example.reportsanalyticsservice.model.entity;

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
@Table(name = "scout_reports")
public class ScoutReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The scout who created the report
    private String scoutKeycloakId;   // reference to Scout user

    // Outer player (not in the club database)
    private Long outerPlayerId;   // optional if you want separate entity

    // Evaluation
    private Integer technicalRating;     // 1–10
    private Integer physicalRating;      // 1–10
    private Integer tacticalRating;      // 1–10
    private Integer mentalityRating;     // 1–10

    private String strengths;            // text
    private String weaknesses;           // text
    private String overallAssessment;    // summary by scout

    private Boolean recommendSigning;    // yes/no

    private LocalDateTime createdAt;
}