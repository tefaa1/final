package com.example.usermanagementservice.controller;
import com.example.usermanagementservice.dto.request.sportManagerReq.SportManagerRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.sportMangerRes.SportManagerResponse;
import com.example.usermanagementservice.dto.response.teamManagerRes.TeamManagerResponse;
import com.example.usermanagementservice.dto.update.sportManagerUp.SportManagerUpdateRequest;
import com.example.usermanagementservice.service.sportmanager.SportManagerService;
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
@RequestMapping("/sport-managers")
@RequiredArgsConstructor
@Tag(name = "Sport Manager", description = "Sport manager operations")
class SportManagerController {

    private final SportManagerService sportManagerService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create sport manager")
    public ResponseEntity<ApiResponse<SportManagerResponse>> createSportManager(
            @Valid @RequestBody SportManagerRequest request) {
        SportManagerResponse response = sportManagerService.createSportManager(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sport manager created successfully"));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all sport managers")
    public ResponseEntity<ApiResponse<List<SportManagerResponse>>> getAllSportManagers() {
        List<SportManagerResponse> managers = sportManagerService.getAllSportManagers();
        return ResponseEntity.ok(ApiResponse.success(managers));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SPORT_MANAGER') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Get sport manager by ID")
    public ResponseEntity<ApiResponse<SportManagerResponse>> getSportManagerById(@PathVariable Long id) {
        SportManagerResponse manager = sportManagerService.getSportManagerById(id);
        return ResponseEntity.ok(ApiResponse.success(manager));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SPORT_MANAGER') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Update sport manager")
    public ResponseEntity<ApiResponse<SportManagerResponse>> updateSportManager(
            @PathVariable Long id,
            @Valid @RequestBody SportManagerUpdateRequest request) {
        SportManagerResponse updated = sportManagerService.updateSportManager(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Sport manager updated successfully"));
    }

    @GetMapping("/{id}/team-managers")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SPORT_MANAGER') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Get team managers under sport manager")
    public ResponseEntity<ApiResponse<List<TeamManagerResponse>>> getTeamManagers(@PathVariable Long id) {
        List<TeamManagerResponse> teamManagers = sportManagerService.getTeamManagersBySportManager(id);
        return ResponseEntity.ok(ApiResponse.success(teamManagers));
    }
}
