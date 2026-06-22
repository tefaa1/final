package com.example.usermanagementservice.controller;
import com.example.usermanagementservice.dto.request.playerReq.PlayerRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.playerRes.PlayerResponse;
import com.example.usermanagementservice.dto.update.playerUp.PlayerStatusUpdateRequest;
import com.example.usermanagementservice.dto.update.playerUp.PlayerUpdateRequest;
import com.example.usermanagementservice.model.enums.StatusOfPlayer;
import com.example.usermanagementservice.service.player.PlayerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/players")
@RequiredArgsConstructor
@Tag(name = "Player", description = "Player operations")
class PlayerController {

    private final PlayerService playerService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create player")
    public ResponseEntity<ApiResponse<PlayerResponse>> createPlayer(
            @Valid @RequestBody PlayerRequest request) {
        PlayerResponse response = playerService.createPlayer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Player created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_COACH', 'ASSISTANT_COACH', 'SPECIFIC_COACH', 'FITNESS_COACH', 'PERFORMANCE_ANALYST', 'TEAM_DOCTOR', 'PHYSIOTHERAPIST') or @securityService.isCurrentUser(#id)")
    @Operation(summary = "Get player by ID")
    public ResponseEntity<ApiResponse<PlayerResponse>> getPlayerById(@PathVariable Long id) {
        PlayerResponse player = playerService.getPlayerById(id);
        return ResponseEntity.ok(ApiResponse.success(player));
    }


    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_COACH', 'ASSISTANT_COACH')")
    @Operation(summary = "Get players by status")
    public ResponseEntity<ApiResponse<List<PlayerResponse>>> getPlayersByStatus(
            @RequestParam StatusOfPlayer status) {
        List<PlayerResponse> players = playerService.getPlayersByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(players));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id)")
    @Operation(summary = "Update player")
    public ResponseEntity<ApiResponse<PlayerResponse>> updatePlayer(
            @PathVariable Long id,
            @Valid @RequestBody PlayerUpdateRequest request) {
        PlayerResponse updated = playerService.updatePlayer(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Player updated successfully"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'TEAM_DOCTOR')")
    @Operation(summary = "Update player status")
    public ResponseEntity<ApiResponse<PlayerResponse>> updatePlayerStatus(
            @PathVariable Long id,
            @Valid @RequestBody PlayerStatusUpdateRequest request) {
        PlayerResponse updated = playerService.updatePlayerStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Player status updated successfully"));
    }

    @PutMapping("/{id}/assign-roster/{rosterId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    @Operation(summary = "Assign roster to player")
    public ResponseEntity<ApiResponse<PlayerResponse>> assignRoster(
            @PathVariable Long id,
            @PathVariable Long rosterId) {
        PlayerResponse updated = playerService.assignRoster(id, rosterId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Roster assigned successfully"));
    }

    @PutMapping("/{id}/assign-contract/{contractId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER')")
    @Operation(summary = "Assign contract to player")
    public ResponseEntity<ApiResponse<PlayerResponse>> assignContract(
            @PathVariable Long id,
            @PathVariable Long contractId) {
        PlayerResponse updated = playerService.assignContract(id, contractId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Contract assigned successfully"));
    }
}