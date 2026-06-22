package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.FitnessTestRequest;
import com.example.medicalfitnessservice.dto.response.FitnessTestResponse;
import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.model.enums.SportType;
import com.example.medicalfitnessservice.service.FitnessTestService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fitness-tests")
@Validated
public class FitnessTestController {

    private final FitnessTestService fitnessTestService;

    public FitnessTestController(FitnessTestService fitnessTestService) {
        this.fitnessTestService = fitnessTestService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST')")
    public ResponseEntity<FitnessTestResponse> createFitnessTest(
            @Validated(Create.class) @RequestBody FitnessTestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fitnessTestService.createFitnessTest(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST')")
    public ResponseEntity<FitnessTestResponse> updateFitnessTest(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody FitnessTestRequest request) {
        return ResponseEntity.ok(fitnessTestService.updateFitnessTest(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','TEAM_MANAGER')")
    public ResponseEntity<FitnessTestResponse> getFitnessTest(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(fitnessTestService.getFitnessTestById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','TEAM_MANAGER')")
    public ResponseEntity<List<FitnessTestResponse>> getAllFitnessTests() {
        return ResponseEntity.ok(fitnessTestService.getAllFitnessTests());
    }

    @GetMapping("/by-sport")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','TEAM_MANAGER')")
    public ResponseEntity<List<FitnessTestResponse>> getFitnessTestsBySportType(
            @RequestParam SportType sportType) {
        return ResponseEntity.ok(fitnessTestService.getFitnessTestsBySportType(sportType));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<Void> deleteFitnessTest(@PathVariable @Positive Long id) {
        fitnessTestService.deleteFitnessTest(id);
        return ResponseEntity.noContent().build();
    }
}

