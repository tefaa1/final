package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.DiagnosisRequest;
import com.example.medicalfitnessservice.dto.response.DiagnosisResponse;
import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.service.DiagnosisService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/diagnoses")
@Validated
public class DiagnosisController {

    private final DiagnosisService diagnosisService;

    public DiagnosisController(DiagnosisService diagnosisService) {
        this.diagnosisService = diagnosisService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<DiagnosisResponse> createDiagnosis(
            @Validated(Create.class) @RequestBody DiagnosisRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(diagnosisService.createDiagnosis(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<DiagnosisResponse> updateDiagnosis(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody DiagnosisRequest request) {
        return ResponseEntity.ok(diagnosisService.updateDiagnosis(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','TEAM_MANAGER')")
    public ResponseEntity<DiagnosisResponse> getDiagnosis(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(diagnosisService.getDiagnosisById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','TEAM_MANAGER')")
    public ResponseEntity<List<DiagnosisResponse>> getAllDiagnoses() {
        return ResponseEntity.ok(diagnosisService.getAllDiagnoses());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<Void> deleteDiagnosis(@PathVariable @Positive Long id) {
        diagnosisService.deleteDiagnosis(id);
        return ResponseEntity.noContent().build();
    }
}

