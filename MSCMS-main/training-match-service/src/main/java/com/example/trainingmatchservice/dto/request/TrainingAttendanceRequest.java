package com.example.trainingmatchservice.dto.request;

import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.training.enums.AttendanceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record TrainingAttendanceRequest(
        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long playerId,

        @NotNull(groups = Create.class)
        @Positive(groups = {Create.class, Update.class})
        Long trainingSessionId,

        @NotNull(groups = Create.class)
        AttendanceStatus status,

        @NotNull(groups = Create.class)
        LocalDateTime checkInTime,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String absenceReason,

        @NotBlank(groups = Create.class)
        @Size(min = 2, groups = {Create.class, Update.class})
        String notes
) {
    public TrainingAttendanceRequest {
        absenceReason = absenceReason != null ? absenceReason.trim() : null;
        notes = notes != null ? notes.trim() : null;
    }
}

