package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchLineupRequest;
import com.example.trainingmatchservice.dto.response.MatchLineupResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.service.MatchLineupService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/match-lineups")
@Validated
public class MatchLineupController {

    private final MatchLineupService matchLineupService;

    public MatchLineupController(MatchLineupService matchLineupService) {
        this.matchLineupService = matchLineupService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<MatchLineupResponse> createMatchLineup(
            @Validated(Create.class) @RequestBody MatchLineupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(matchLineupService.createMatchLineup(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<MatchLineupResponse> updateMatchLineup(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody MatchLineupRequest request) {
        return ResponseEntity.ok(matchLineupService.updateMatchLineup(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<MatchLineupResponse> getMatchLineup(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(matchLineupService.getMatchLineupById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<MatchLineupResponse>> getAllMatchLineups() {
        return ResponseEntity.ok(matchLineupService.getAllMatchLineups());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Void> deleteMatchLineup(@PathVariable @Positive Long id) {
        matchLineupService.deleteMatchLineup(id);
        return ResponseEntity.noContent().build();
    }
}

