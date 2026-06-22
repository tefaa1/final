package com.example.trainingmatchservice.dto.response;

import com.example.trainingmatchservice.model.training.enums.AttendanceStatus;

import java.time.LocalDateTime;

public record TrainingAttendanceResponse(
        Long id,
        Long playerId,
        Long trainingSessionId,
        AttendanceStatus status,
        LocalDateTime checkInTime,
        String absenceReason,
        String notes
) {}

