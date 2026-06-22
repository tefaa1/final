package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.TrainingPlanRequest;
import com.example.trainingmatchservice.dto.response.TrainingPlanResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.service.TrainingPlanService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/training-plans")
@Validated
public class TrainingPlanController {

    private final TrainingPlanService trainingPlanService;

    public TrainingPlanController(TrainingPlanService trainingPlanService) {
        this.trainingPlanService = trainingPlanService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<TrainingPlanResponse> createTrainingPlan(
            @Validated(Create.class) @RequestBody TrainingPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(trainingPlanService.createTrainingPlan(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<TrainingPlanResponse> updateTrainingPlan(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody TrainingPlanRequest request) {
        return ResponseEntity.ok(trainingPlanService.updateTrainingPlan(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<TrainingPlanResponse> getTrainingPlan(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(trainingPlanService.getTrainingPlanById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<TrainingPlanResponse>> getAllTrainingPlans() {
        return ResponseEntity.ok(trainingPlanService.getAllTrainingPlans());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Void> deleteTrainingPlan(@PathVariable @Positive Long id) {
        trainingPlanService.deleteTrainingPlan(id);
        return ResponseEntity.noContent().build();
    }
}

