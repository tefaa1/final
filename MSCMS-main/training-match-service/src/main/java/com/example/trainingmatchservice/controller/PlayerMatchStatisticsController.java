package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.PlayerMatchStatisticsRequest;
import com.example.trainingmatchservice.dto.response.PlayerMatchStatisticsResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.match.enums.SportType;
import com.example.trainingmatchservice.service.PlayerMatchStatisticsService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/player-match-statistics")
@Validated
public class PlayerMatchStatisticsController {

    private final PlayerMatchStatisticsService playerMatchStatisticsService;

    public PlayerMatchStatisticsController(PlayerMatchStatisticsService playerMatchStatisticsService) {
        this.playerMatchStatisticsService = playerMatchStatisticsService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<PlayerMatchStatisticsResponse> createMatchStats(
            @Validated(Create.class) @RequestBody PlayerMatchStatisticsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerMatchStatisticsService.createPlayerMatchStatistics(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<PlayerMatchStatisticsResponse> updateMatchStats(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody PlayerMatchStatisticsRequest request) {
        return ResponseEntity.ok(playerMatchStatisticsService.updatePlayerMatchStatistics(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST','SPORT_MANAGER')")
    public ResponseEntity<PlayerMatchStatisticsResponse> getMatchStats(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(playerMatchStatisticsService.getPlayerMatchStatisticsById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST','SPORT_MANAGER')")
    public ResponseEntity<List<PlayerMatchStatisticsResponse>> getAllMatchStats() {
        return ResponseEntity.ok(playerMatchStatisticsService.getAllPlayerMatchStatistics());
    }

    @GetMapping("/by-match/{matchId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST','SPORT_MANAGER')")
    public ResponseEntity<List<PlayerMatchStatisticsResponse>> getStatsByMatch(
            @PathVariable @Positive Long matchId) {
        return ResponseEntity.ok(playerMatchStatisticsService.getStatsByMatch(matchId));
    }

    @GetMapping("/by-sport")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST','SPORT_MANAGER')")
    public ResponseEntity<List<PlayerMatchStatisticsResponse>> getStatsBySportType(
            @RequestParam SportType sportType) {
        return ResponseEntity.ok(playerMatchStatisticsService.getStatsBySportType(sportType));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Void> deleteMatchStats(@PathVariable @Positive Long id) {
        playerMatchStatisticsService.deletePlayerMatchStatistics(id);
        return ResponseEntity.noContent().build();
    }
}

