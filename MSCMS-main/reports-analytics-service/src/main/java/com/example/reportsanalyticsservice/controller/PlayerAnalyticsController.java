package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.PlayerAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.PlayerAnalyticsResponse;
import com.example.reportsanalyticsservice.dto.validation.Create;
import com.example.reportsanalyticsservice.dto.validation.Update;
import com.example.reportsanalyticsservice.model.enums.SportType;
import com.example.reportsanalyticsservice.service.PlayerAnalyticsService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/player-analytics")
@Validated
public class PlayerAnalyticsController {

    private final PlayerAnalyticsService service;

    public PlayerAnalyticsController(PlayerAnalyticsService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST')")
    public ResponseEntity<PlayerAnalyticsResponse> create(@Validated(Create.class) @RequestBody PlayerAnalyticsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST')")
    public ResponseEntity<PlayerAnalyticsResponse> update(@PathVariable @Positive Long id, @Validated(Update.class) @RequestBody PlayerAnalyticsRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH','TEAM_MANAGER')")
    public ResponseEntity<PlayerAnalyticsResponse> getById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH','TEAM_MANAGER')")
    public ResponseEntity<List<PlayerAnalyticsResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-sport")
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH','TEAM_MANAGER')")
    public ResponseEntity<List<PlayerAnalyticsResponse>> getBySportType(@RequestParam SportType sportType) {
        return ResponseEntity.ok(service.getBySportType(sportType));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
