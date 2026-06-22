package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.TrainingAttendanceRequest;
import com.example.trainingmatchservice.dto.response.TrainingAttendanceResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.service.TrainingAttendanceService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/training-attendance")
@Validated
public class TrainingAttendanceController {

    private final TrainingAttendanceService trainingAttendanceService;

    public TrainingAttendanceController(TrainingAttendanceService trainingAttendanceService) {
        this.trainingAttendanceService = trainingAttendanceService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH')")
    public ResponseEntity<TrainingAttendanceResponse> createTrainingAttendance(
            @Validated(Create.class) @RequestBody TrainingAttendanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(trainingAttendanceService.createTrainingAttendance(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH')")
    public ResponseEntity<TrainingAttendanceResponse> updateTrainingAttendance(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody TrainingAttendanceRequest request) {
        return ResponseEntity.ok(trainingAttendanceService.updateTrainingAttendance(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER')")
    public ResponseEntity<TrainingAttendanceResponse> getTrainingAttendance(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(trainingAttendanceService.getTrainingAttendanceById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER')")
    public ResponseEntity<List<TrainingAttendanceResponse>> getAllTrainingAttendances() {
        return ResponseEntity.ok(trainingAttendanceService.getAllTrainingAttendances());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Void> deleteTrainingAttendance(@PathVariable @Positive Long id) {
        trainingAttendanceService.deleteTrainingAttendance(id);
        return ResponseEntity.noContent().build();
    }
}

