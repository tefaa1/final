package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.RecoveryProgramRequest;
import com.example.medicalfitnessservice.dto.response.RecoveryProgramResponse;
import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.service.RecoveryProgramService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recovery-programs")
@Validated
public class RecoveryProgramController {

    private final RecoveryProgramService recoveryProgramService;

    public RecoveryProgramController(RecoveryProgramService recoveryProgramService) {
        this.recoveryProgramService = recoveryProgramService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR')")
    public ResponseEntity<RecoveryProgramResponse> createRecoveryProgram(
            @Validated(Create.class) @RequestBody RecoveryProgramRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recoveryProgramService.createRecoveryProgram(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR')")
    public ResponseEntity<RecoveryProgramResponse> updateRecoveryProgram(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody RecoveryProgramRequest request) {
        return ResponseEntity.ok(recoveryProgramService.updateRecoveryProgram(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR','TEAM_MANAGER')")
    public ResponseEntity<RecoveryProgramResponse> getRecoveryProgram(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(recoveryProgramService.getRecoveryProgramById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR','TEAM_MANAGER')")
    public ResponseEntity<List<RecoveryProgramResponse>> getAllRecoveryPrograms() {
        return ResponseEntity.ok(recoveryProgramService.getAllRecoveryPrograms());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR')")
    public ResponseEntity<Void> deleteRecoveryProgram(@PathVariable @Positive Long id) {
        recoveryProgramService.deleteRecoveryProgram(id);
        return ResponseEntity.noContent().build();
    }
}

