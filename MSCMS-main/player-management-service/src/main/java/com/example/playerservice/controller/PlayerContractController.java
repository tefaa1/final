package com.example.playerservice.controller;

import com.example.playerservice.dto.request.PlayerContractRequest;
import com.example.playerservice.dto.response.PlayerContractResponse;
import com.example.playerservice.service.PlayerContractService;
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
@RequestMapping("/player-contracts")
@Validated
public class PlayerContractController {

    private final PlayerContractService playerContractService;

    public PlayerContractController(PlayerContractService playerContractService) {
        this.playerContractService = playerContractService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<PlayerContractResponse> createContract(
            @Validated(Create.class) @RequestBody PlayerContractRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerContractService.createPlayerContract(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<PlayerContractResponse> updateContract(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody PlayerContractRequest request) {
        return ResponseEntity.ok(playerContractService.updatePlayerContract(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SPORT_MANAGER')")
    public ResponseEntity<PlayerContractResponse> getContract(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(playerContractService.getPlayerContractById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SPORT_MANAGER')")
    public ResponseEntity<List<PlayerContractResponse>> getAllContracts() {
        return ResponseEntity.ok(playerContractService.getAllPlayerContracts());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    public ResponseEntity<Void> deleteContract(@PathVariable @Positive Long id) {
        playerContractService.deletePlayerContract(id);
        return ResponseEntity.noContent().build();
    }
}

