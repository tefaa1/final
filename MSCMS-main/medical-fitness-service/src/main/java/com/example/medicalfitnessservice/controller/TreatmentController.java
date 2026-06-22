package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.TreatmentRequest;
import com.example.medicalfitnessservice.dto.response.TreatmentResponse;
import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.service.TreatmentService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/treatments")
@Validated
public class TreatmentController {

    private final TreatmentService treatmentService;

    public TreatmentController(TreatmentService treatmentService) {
        this.treatmentService = treatmentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<TreatmentResponse> createTreatment(
            @Validated(Create.class) @RequestBody TreatmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(treatmentService.createTreatment(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<TreatmentResponse> updateTreatment(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody TreatmentRequest request) {
        return ResponseEntity.ok(treatmentService.updateTreatment(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','TEAM_MANAGER')")
    public ResponseEntity<TreatmentResponse> getTreatment(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(treatmentService.getTreatmentById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','TEAM_MANAGER')")
    public ResponseEntity<List<TreatmentResponse>> getAllTreatments() {
        return ResponseEntity.ok(treatmentService.getAllTreatments());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<Void> deleteTreatment(@PathVariable @Positive Long id) {
        treatmentService.deleteTreatment(id);
        return ResponseEntity.noContent().build();
    }
}

