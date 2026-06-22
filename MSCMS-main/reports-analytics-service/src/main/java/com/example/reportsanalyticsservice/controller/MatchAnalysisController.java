package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.MatchAnalysisRequest;
import com.example.reportsanalyticsservice.dto.response.MatchAnalysisResponse;
import com.example.reportsanalyticsservice.dto.validation.Create;
import com.example.reportsanalyticsservice.dto.validation.Update;
import com.example.reportsanalyticsservice.model.enums.SportType;
import com.example.reportsanalyticsservice.service.MatchAnalysisService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/match-analyses")
@Validated
public class MatchAnalysisController {

    private final MatchAnalysisService service;

    public MatchAnalysisController(MatchAnalysisService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH')")
    public ResponseEntity<MatchAnalysisResponse> create(@Validated(Create.class) @RequestBody MatchAnalysisRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH')")
    public ResponseEntity<MatchAnalysisResponse> update(@PathVariable @Positive Long id, @Validated(Update.class) @RequestBody MatchAnalysisRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH','TEAM_MANAGER','SPORT_MANAGER')")
    public ResponseEntity<MatchAnalysisResponse> getById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH','TEAM_MANAGER','SPORT_MANAGER')")
    public ResponseEntity<List<MatchAnalysisResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-sport")
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH','TEAM_MANAGER','SPORT_MANAGER')")
    public ResponseEntity<List<MatchAnalysisResponse>> getBySportType(@RequestParam SportType sportType) {
        return ResponseEntity.ok(service.getBySportType(sportType));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST')")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
