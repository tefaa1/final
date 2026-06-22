package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.RehabilitationRequest;
import com.example.medicalfitnessservice.dto.response.RehabilitationResponse;
import com.example.medicalfitnessservice.dto.validation.Create;
import com.example.medicalfitnessservice.dto.validation.Update;
import jakarta.validation.constraints.Positive;
import com.example.medicalfitnessservice.service.RehabilitationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rehabilitations")
@Validated
public class RehabilitationController {

    private final RehabilitationService rehabilitationService;

    public RehabilitationController(RehabilitationService rehabilitationService) {
        this.rehabilitationService = rehabilitationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR')")
    public ResponseEntity<RehabilitationResponse> createRehabilitation(
            @Validated(Create.class) @RequestBody RehabilitationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(rehabilitationService.createRehabilitation(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR')")
    public ResponseEntity<RehabilitationResponse> updateRehabilitation(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody RehabilitationRequest request) {
        return ResponseEntity.ok(rehabilitationService.updateRehabilitation(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR','TEAM_MANAGER')")
    public ResponseEntity<RehabilitationResponse> getRehabilitation(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(rehabilitationService.getRehabilitationById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR','TEAM_MANAGER')")
    public ResponseEntity<List<RehabilitationResponse>> getAllRehabilitations() {
        return ResponseEntity.ok(rehabilitationService.getAllRehabilitations());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHYSIOTHERAPIST','DOCTOR')")
    public ResponseEntity<Void> deleteRehabilitation(@PathVariable @Positive Long id) {
        rehabilitationService.deleteRehabilitation(id);
        return ResponseEntity.noContent().build();
    }
}

