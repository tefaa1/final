package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.TrainingDrillRequest;
import com.example.trainingmatchservice.dto.response.TrainingDrillResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.service.TrainingDrillService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/training-drills")
@Validated
public class TrainingDrillController {

    private final TrainingDrillService trainingDrillService;

    public TrainingDrillController(TrainingDrillService trainingDrillService) {
        this.trainingDrillService = trainingDrillService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH','SPECIFIC_COACH')")
    public ResponseEntity<TrainingDrillResponse> createTrainingDrill(
            @Validated(Create.class) @RequestBody TrainingDrillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(trainingDrillService.createTrainingDrill(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH','SPECIFIC_COACH')")
    public ResponseEntity<TrainingDrillResponse> updateTrainingDrill(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody TrainingDrillRequest request) {
        return ResponseEntity.ok(trainingDrillService.updateTrainingDrill(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH','ASSISTANT_COACH','SPECIFIC_COACH','FITNESS_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<TrainingDrillResponse> getTrainingDrill(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(trainingDrillService.getTrainingDrillById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH','ASSISTANT_COACH','SPECIFIC_COACH','FITNESS_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<TrainingDrillResponse>> getAllTrainingDrills() {
        return ResponseEntity.ok(trainingDrillService.getAllTrainingDrills());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH')")
    public ResponseEntity<Void> deleteTrainingDrill(@PathVariable @Positive Long id) {
        trainingDrillService.deleteTrainingDrill(id);
        return ResponseEntity.noContent().build();
    }
}

