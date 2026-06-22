package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.TrainingLoadRequest;
import com.example.medicalfitnessservice.dto.response.TrainingLoadResponse;
import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.service.TrainingLoadService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/training-loads")
@Validated
public class TrainingLoadController {

    private final TrainingLoadService trainingLoadService;

    public TrainingLoadController(TrainingLoadService trainingLoadService) {
        this.trainingLoadService = trainingLoadService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','FITNESS_COACH')")
    public ResponseEntity<TrainingLoadResponse> createTrainingLoad(
            @Validated(Create.class) @RequestBody TrainingLoadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(trainingLoadService.createTrainingLoad(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','FITNESS_COACH')")
    public ResponseEntity<TrainingLoadResponse> updateTrainingLoad(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody TrainingLoadRequest request) {
        return ResponseEntity.ok(trainingLoadService.updateTrainingLoad(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','FITNESS_COACH','TEAM_MANAGER')")
    public ResponseEntity<TrainingLoadResponse> getTrainingLoad(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(trainingLoadService.getTrainingLoadById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','FITNESS_COACH','TEAM_MANAGER')")
    public ResponseEntity<List<TrainingLoadResponse>> getAllTrainingLoads() {
        return ResponseEntity.ok(trainingLoadService.getAllTrainingLoads());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST')")
    public ResponseEntity<Void> deleteTrainingLoad(@PathVariable @Positive Long id) {
        trainingLoadService.deleteTrainingLoad(id);
        return ResponseEntity.noContent().build();
    }
}

