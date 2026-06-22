package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchRequest;
import com.example.trainingmatchservice.dto.response.MatchResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.model.match.enums.SportType;
import com.example.trainingmatchservice.service.MatchService;
import com.example.trainingmatchservice.service.MatchSyncService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/matches")
@Validated
public class MatchController {

    private final MatchService matchService;
    private final MatchSyncService matchSyncService;

    public MatchController(MatchService matchService, MatchSyncService matchSyncService) {
        this.matchService = matchService;
        this.matchSyncService = matchSyncService;
    }

    /** Manually pull Barça's upcoming fixtures from football-data.org into our DB. */
    @PostMapping("/sync-external")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Map<String, Object>> syncExternal() throws Exception {
        return ResponseEntity.ok(matchSyncService.sync());
    }

    /** Pull Barça's REAL upcoming fixtures (incl. friendlies) from API-Football. */
    @PostMapping("/sync-upcoming")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Map<String, Object>> syncUpcoming() throws Exception {
        return ResponseEntity.ok(matchSyncService.syncUpcoming());
    }

    /** Generate per-match player statistics (goals/assists/rating) for the squad. */
    @PostMapping("/generate-player-stats")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Map<String, Object>> generatePlayerStats() {
        return ResponseEntity.ok(matchSyncService.generatePlayerStats(true));
    }

    /** Populate realistic upcoming demo fixtures (used during the off-season). */
    @PostMapping("/demo-fixtures")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Map<String, Object>> demoFixtures() {
        return ResponseEntity.ok(matchSyncService.generateDemoFixtures());
    }

    /** Live league table for a competition (e.g. PD = La Liga, CL = Champions League). */
    @GetMapping("/standings/{code}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<Map<String, Object>>> standings(@PathVariable String code) throws Exception {
        return ResponseEntity.ok(matchSyncService.standings(code));
    }

    /** All group tables for a competition (e.g. WC = World Cup groups). */
    @GetMapping("/competition/{code}/groups")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST','SCOUT','FAN')")
    public ResponseEntity<List<Map<String, Object>>> competitionGroups(@PathVariable String code) throws Exception {
        return ResponseEntity.ok(matchSyncService.competitionGroups(code));
    }

    /** All matches for a competition (groups + knockout) — used to draw a bracket. */
    @GetMapping("/competition/{code}/matches")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST','SCOUT','FAN')")
    public ResponseEntity<List<Map<String, Object>>> competitionMatchesRaw(@PathVariable String code) throws Exception {
        return ResponseEntity.ok(matchSyncService.competitionMatches(code));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<MatchResponse> createMatch(
            @Validated(Create.class) @RequestBody MatchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(matchService.createMatch(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<MatchResponse> updateMatch(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody MatchRequest request) {
        return ResponseEntity.ok(matchService.updateMatch(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<MatchResponse> getMatch(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(matchService.getMatchById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<MatchResponse>> getAllMatches() {
        return ResponseEntity.ok(matchService.getAllMatches());
    }

    @GetMapping("/by-sport")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<MatchResponse>> getMatchesBySportType(@RequestParam SportType sportType) {
        return ResponseEntity.ok(matchService.getMatchesBySportType(sportType));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER')")
    public ResponseEntity<Void> deleteMatch(@PathVariable @Positive Long id) {
        matchService.deleteMatch(id);
        return ResponseEntity.noContent().build();
    }
}

