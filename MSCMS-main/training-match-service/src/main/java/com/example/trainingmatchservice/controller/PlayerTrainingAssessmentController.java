package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.PlayerTrainingAssessmentRequest;
import com.example.trainingmatchservice.dto.response.PlayerTrainingAssessmentResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.service.PlayerTrainingAssessmentService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/player-training-assessments")
@Validated
public class PlayerTrainingAssessmentController {

    private final PlayerTrainingAssessmentService playerTrainingAssessmentService;

    public PlayerTrainingAssessmentController(PlayerTrainingAssessmentService playerTrainingAssessmentService) {
        this.playerTrainingAssessmentService = playerTrainingAssessmentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<PlayerTrainingAssessmentResponse> createPlayerTrainingAssessment(
            @Validated(Create.class) @RequestBody PlayerTrainingAssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerTrainingAssessmentService.createPlayerTrainingAssessment(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<PlayerTrainingAssessmentResponse> updatePlayerTrainingAssessment(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody PlayerTrainingAssessmentRequest request) {
        return ResponseEntity.ok(playerTrainingAssessmentService.updatePlayerTrainingAssessment(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<PlayerTrainingAssessmentResponse> getPlayerTrainingAssessment(
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(playerTrainingAssessmentService.getPlayerTrainingAssessmentById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<PlayerTrainingAssessmentResponse>> getAllPlayerTrainingAssessments() {
        return ResponseEntity.ok(playerTrainingAssessmentService.getAllPlayerTrainingAssessments());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH')")
    public ResponseEntity<Void> deletePlayerTrainingAssessment(@PathVariable @Positive Long id) {
        playerTrainingAssessmentService.deletePlayerTrainingAssessment(id);
        return ResponseEntity.noContent().build();
    }
}

