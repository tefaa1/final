package com.example.playerservice.controller;

import com.example.playerservice.dto.request.SportRequest;
import com.example.playerservice.dto.response.SportResponse;
import com.example.playerservice.model.enums.SportType;
import com.example.playerservice.service.SportService;
import com.example.playerservice.dto.validation.Create;
import com.example.playerservice.dto.validation.Update;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sports")
@Validated
public class SportController {

    private final SportService sportService;

    public SportController(SportService sportService) {
        this.sportService = sportService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SportResponse> createSport(
            @Validated(Create.class) @RequestBody SportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sportService.createSport(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SportResponse> updateSport(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody SportRequest request) {
        return ResponseEntity.ok(sportService.updateSport(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SPORT_MANAGER')")
    public ResponseEntity<SportResponse> getSport(
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(sportService.getSportById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SPORT_MANAGER')")
    public ResponseEntity<List<SportResponse>> getAllSports() {
        return ResponseEntity.ok(sportService.getAllSports());
    }

    @GetMapping("/by-type")
    @PreAuthorize("hasAnyRole('ADMIN', 'SPORT_MANAGER')")
    public ResponseEntity<List<SportResponse>> getSportsByType(
            @RequestParam SportType sportType) {
        return ResponseEntity.ok(sportService.getSportsByType(sportType));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSport(@PathVariable @Positive Long id) {
        sportService.deleteSport(id);
        return ResponseEntity.noContent().build();
    }
}
