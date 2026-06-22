package com.example.trainingmatchservice.model.training.entity;

import com.example.trainingmatchservice.model.training.enums.AttendanceStatus;
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
@Table(name = "training_attendances")
public class TrainingAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long playerId;  // Reference to Player Service

    @ManyToOne
    @JoinColumn(name = "training_session_id")
    private TrainingSession trainingSession;

    @Enumerated(EnumType.STRING)
    private AttendanceStatus status;

    private LocalDateTime checkInTime;
    private String absenceReason;
    private String notes;
}
