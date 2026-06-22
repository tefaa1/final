package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.InjuryRequest;
import com.example.medicalfitnessservice.dto.response.InjuryResponse;
import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import com.example.medicalfitnessservice.service.InjuryService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/injuries")
@Validated
public class InjuryController {

    private final InjuryService injuryService;

    public InjuryController(InjuryService injuryService) {
        this.injuryService = injuryService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST')")
    public ResponseEntity<InjuryResponse> createInjury(
            @Validated(Create.class) @RequestBody InjuryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(injuryService.createInjury(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST')")
    public ResponseEntity<InjuryResponse> updateInjury(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody InjuryRequest request) {
        return ResponseEntity.ok(injuryService.updateInjury(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','TEAM_MANAGER')")
    public ResponseEntity<InjuryResponse> getInjury(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(injuryService.getInjuryById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHYSIOTHERAPIST','TEAM_MANAGER')")
    public ResponseEntity<List<InjuryResponse>> getAllInjuries() {
        return ResponseEntity.ok(injuryService.getAllInjuries());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<Void> deleteInjury(@PathVariable @Positive Long id) {
        injuryService.deleteInjury(id);
        return ResponseEntity.noContent().build();
    }
}

