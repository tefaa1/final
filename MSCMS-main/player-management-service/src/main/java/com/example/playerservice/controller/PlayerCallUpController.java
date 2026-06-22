package com.example.playerservice.controller;

import com.example.playerservice.dto.request.PlayerCallUpRequestCreate;
import com.example.playerservice.dto.response.PlayerCallUpResponse;
import com.example.playerservice.dto.validation.Create;
import com.example.playerservice.dto.validation.Update;
import com.example.playerservice.service.PlayerCallUpRequestService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/player-callups")
@Validated
public class PlayerCallUpController {

    private final PlayerCallUpRequestService playerCallUpRequestService;

    public PlayerCallUpController(PlayerCallUpRequestService playerCallUpRequestService) {
        this.playerCallUpRequestService = playerCallUpRequestService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'NATIONAL_TEAM')")
    public ResponseEntity<PlayerCallUpResponse> createCallUp(
            @Validated(Create.class) @RequestBody PlayerCallUpRequestCreate request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerCallUpRequestService.createCallUpRequest(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'NATIONAL_TEAM')")
    public ResponseEntity<PlayerCallUpResponse> updateCallUp(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody PlayerCallUpRequestCreate request) {
        return ResponseEntity.ok(playerCallUpRequestService.updateCallUpRequest(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'NATIONAL_TEAM')")
    public ResponseEntity<PlayerCallUpResponse> getCallUp(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(playerCallUpRequestService.getCallUpRequestById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'NATIONAL_TEAM')")
    public ResponseEntity<List<PlayerCallUpResponse>> getAllCallUps() {
        return ResponseEntity.ok(playerCallUpRequestService.getAllCallUpRequests());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'NATIONAL_TEAM')")
    public ResponseEntity<Void> deleteCallUp(@PathVariable @Positive Long id) {
        playerCallUpRequestService.deleteCallUpRequest(id);
        return ResponseEntity.noContent().build();
    }
}

