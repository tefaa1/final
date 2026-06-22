package com.example.playerservice.controller;

import com.example.playerservice.dto.request.PlayerTransferIncomingRequest;
import com.example.playerservice.dto.response.PlayerTransferIncomingResponse;
import com.example.playerservice.service.PlayerTransferIncomingService;
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
@RequestMapping("/player-transfers-incoming")
@Validated
public class PlayerTransferIncomingController {

    private final PlayerTransferIncomingService playerTransferIncomingService;

    public PlayerTransferIncomingController(PlayerTransferIncomingService playerTransferIncomingService) {
        this.playerTransferIncomingService = playerTransferIncomingService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SCOUT')")
    public ResponseEntity<PlayerTransferIncomingResponse> createIncomingTransfer(
            @Validated(Create.class) @RequestBody PlayerTransferIncomingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerTransferIncomingService.createIncomingTransfer(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SCOUT')")
    public ResponseEntity<PlayerTransferIncomingResponse> updateIncomingTransfer(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody PlayerTransferIncomingRequest request) {
        return ResponseEntity.ok(playerTransferIncomingService.updateIncomingTransfer(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SCOUT', 'SPORT_MANAGER')")
    public ResponseEntity<PlayerTransferIncomingResponse> getIncomingTransfer(
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(playerTransferIncomingService.getIncomingTransferById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SCOUT', 'SPORT_MANAGER')")
    public ResponseEntity<List<PlayerTransferIncomingResponse>> getAllIncomingTransfers() {
        return ResponseEntity.ok(playerTransferIncomingService.getAllIncomingTransfers());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<Void> deleteIncomingTransfer(@PathVariable @Positive Long id) {
        playerTransferIncomingService.deleteIncomingTransfer(id);
        return ResponseEntity.noContent().build();
    }
}

