package com.example.playerservice.controller;

import com.example.playerservice.dto.request.OuterTeamRequest;
import com.example.playerservice.dto.response.OuterTeamResponse;
import com.example.playerservice.dto.validation.Create;
import com.example.playerservice.dto.validation.Update;
import com.example.playerservice.service.OuterTeamService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/outer-teams")
@Validated
public class OuterTeamController {

    private final OuterTeamService outerTeamService;

    public OuterTeamController(OuterTeamService outerTeamService) {
        this.outerTeamService = outerTeamService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OuterTeamResponse> createOuterTeam(
            @Validated(Create.class) @RequestBody OuterTeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(outerTeamService.createOuterTeam(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OuterTeamResponse> updateOuterTeam(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody OuterTeamRequest request) {
        return ResponseEntity.ok(outerTeamService.updateOuterTeam(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SPORT_MANAGER')")
    public ResponseEntity<OuterTeamResponse> getOuterTeam(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(outerTeamService.getOuterTeamById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SPORT_MANAGER')")
    public ResponseEntity<List<OuterTeamResponse>> getAllOuterTeams() {
        return ResponseEntity.ok(outerTeamService.getAllOuterTeams());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteOuterTeam(@PathVariable @Positive Long id) {
        outerTeamService.deleteOuterTeam(id);
        return ResponseEntity.noContent().build();
    }
}

