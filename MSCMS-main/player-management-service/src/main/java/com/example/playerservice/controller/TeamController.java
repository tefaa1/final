package com.example.playerservice.controller;

import com.example.playerservice.dto.request.TeamRequest;
import com.example.playerservice.dto.response.TeamResponse;
import com.example.playerservice.service.TeamService;
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
@RequestMapping("/teams")
@Validated
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamResponse> createTeam(
            @Validated(Create.class) @RequestBody TeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SPORT_MANAGER')")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody TeamRequest request) {
        return ResponseEntity.ok(teamService.updateTeam(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SPORT_MANAGER', 'TEAM_MANAGER')")
    public ResponseEntity<TeamResponse> getTeam(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SPORT_MANAGER')")
    public ResponseEntity<List<TeamResponse>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTeam(@PathVariable @Positive Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }
}

