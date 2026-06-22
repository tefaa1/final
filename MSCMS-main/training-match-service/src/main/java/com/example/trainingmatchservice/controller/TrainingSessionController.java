package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.TrainingSessionRequest;
import com.example.trainingmatchservice.dto.response.TrainingSessionResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.service.TrainingSessionService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/training-sessions")
@Validated
public class TrainingSessionController {

    private final TrainingSessionService trainingSessionService;

    public TrainingSessionController(TrainingSessionService trainingSessionService) {
        this.trainingSessionService = trainingSessionService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','SPECIFIC_COACH')")
    public ResponseEntity<TrainingSessionResponse> createTrainingSession(
            @Validated(Create.class) @RequestBody TrainingSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(trainingSessionService.createTrainingSession(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','SPECIFIC_COACH')")
    public ResponseEntity<TrainingSessionResponse> updateTrainingSession(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody TrainingSessionRequest request) {
        return ResponseEntity.ok(trainingSessionService.updateTrainingSession(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','SPECIFIC_COACH','ASSISTANT_COACH','FITNESS_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<TrainingSessionResponse> getTrainingSession(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(trainingSessionService.getTrainingSessionById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','SPECIFIC_COACH','ASSISTANT_COACH','FITNESS_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<TrainingSessionResponse>> getAllTrainingSessions() {
        return ResponseEntity.ok(trainingSessionService.getAllTrainingSessions());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER')")
    public ResponseEntity<Void> deleteTrainingSession(@PathVariable @Positive Long id) {
        trainingSessionService.deleteTrainingSession(id);
        return ResponseEntity.noContent().build();
    }
}

