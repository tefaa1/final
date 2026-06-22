package com.example.playerservice.controller;

import com.example.playerservice.dto.request.RosterRequest;
import com.example.playerservice.dto.response.RosterResponse;
import com.example.playerservice.service.RosterService;
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
@RequestMapping("/rosters")
@Validated
public class RosterController {

    private final RosterService rosterService;

    public RosterController(RosterService rosterService) {
        this.rosterService = rosterService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<RosterResponse> createRoster(
            @Validated(Create.class) @RequestBody RosterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rosterService.createRoster(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<RosterResponse> updateRoster(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody RosterRequest request) {
        return ResponseEntity.ok(rosterService.updateRoster(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SPORT_MANAGER')")
    public ResponseEntity<RosterResponse> getRoster(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(rosterService.getRosterById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SPORT_MANAGER')")
    public ResponseEntity<List<RosterResponse>> getAllRosters() {
        return ResponseEntity.ok(rosterService.getAllRosters());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<Void> deleteRoster(@PathVariable @Positive Long id) {
        rosterService.deleteRoster(id);
        return ResponseEntity.noContent().build();
    }
}

