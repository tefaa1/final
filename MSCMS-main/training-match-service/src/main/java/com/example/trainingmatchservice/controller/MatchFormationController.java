package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchFormationRequest;
import com.example.trainingmatchservice.dto.response.MatchFormationResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.service.MatchFormationService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/match-formations")
@Validated
public class MatchFormationController {

    private final MatchFormationService matchFormationService;

    public MatchFormationController(MatchFormationService matchFormationService) {
        this.matchFormationService = matchFormationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<MatchFormationResponse> createMatchFormation(
            @Validated(Create.class) @RequestBody MatchFormationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(matchFormationService.createMatchFormation(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<MatchFormationResponse> updateMatchFormation(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody MatchFormationRequest request) {
        return ResponseEntity.ok(matchFormationService.updateMatchFormation(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<MatchFormationResponse> getMatchFormation(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(matchFormationService.getMatchFormationById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<MatchFormationResponse>> getAllMatchFormations() {
        return ResponseEntity.ok(matchFormationService.getAllMatchFormations());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Void> deleteMatchFormation(@PathVariable @Positive Long id) {
        matchFormationService.deleteMatchFormation(id);
        return ResponseEntity.noContent().build();
    }
}

