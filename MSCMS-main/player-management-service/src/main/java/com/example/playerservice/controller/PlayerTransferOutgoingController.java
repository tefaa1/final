package com.example.playerservice.controller;

import com.example.playerservice.dto.request.PlayerTransferOutgoingRequest;
import com.example.playerservice.dto.response.PlayerTransferOutgoingResponse;
import com.example.playerservice.service.PlayerTransferOutgoingService;
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
@RequestMapping("/player-transfers-outgoing")
@Validated
public class PlayerTransferOutgoingController {

    private final PlayerTransferOutgoingService playerTransferOutgoingService;

    public PlayerTransferOutgoingController(PlayerTransferOutgoingService playerTransferOutgoingService) {
        this.playerTransferOutgoingService = playerTransferOutgoingService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<PlayerTransferOutgoingResponse> createOutgoingTransfer(
            @Validated(Create.class) @RequestBody PlayerTransferOutgoingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerTransferOutgoingService.createOutgoingTransfer(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<PlayerTransferOutgoingResponse> updateOutgoingTransfer(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody PlayerTransferOutgoingRequest request) {
        return ResponseEntity.ok(playerTransferOutgoingService.updateOutgoingTransfer(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SPORT_MANAGER')")
    public ResponseEntity<PlayerTransferOutgoingResponse> getOutgoingTransfer(
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(playerTransferOutgoingService.getOutgoingTransferById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SPORT_MANAGER')")
    public ResponseEntity<List<PlayerTransferOutgoingResponse>> getAllOutgoingTransfers() {
        return ResponseEntity.ok(playerTransferOutgoingService.getAllOutgoingTransfers());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<Void> deleteOutgoingTransfer(@PathVariable @Positive Long id) {
        playerTransferOutgoingService.deleteOutgoingTransfer(id);
        return ResponseEntity.noContent().build();
    }
}

