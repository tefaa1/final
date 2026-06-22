package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.teamMangerReq.AssignStaffRequest;
import com.example.usermanagementservice.dto.request.teamMangerReq.TeamManagerRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.teamManagerRes.TeamManagerResponse;
import com.example.usermanagementservice.dto.update.teamManagerUp.TeamManagerUpdateRequest;
import com.example.usermanagementservice.service.teamManagerService.TeamManagerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/team-managers")
@RequiredArgsConstructor
@Tag(name = "Team Manager", description = "Team manager operations")
class TeamManagerController {

    private final TeamManagerService teamManagerService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create team manager")
    public ResponseEntity<ApiResponse<TeamManagerResponse>> createTeamManager(
            @Valid @RequestBody TeamManagerRequest request) {
        TeamManagerResponse response = teamManagerService.createTeamManager(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Team manager created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('TEAM_MANAGER') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Get team manager by ID")
    public ResponseEntity<ApiResponse<TeamManagerResponse>> getTeamManagerById(@PathVariable Long id) {
        TeamManagerResponse manager = teamManagerService.getTeamManagerById(id);
        return ResponseEntity.ok(ApiResponse.success(manager));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('TEAM_MANAGER') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Update team manager")
    public ResponseEntity<ApiResponse<TeamManagerResponse>> updateTeamManager(
            @PathVariable Long id,
            @Valid @RequestBody TeamManagerUpdateRequest request) {
        TeamManagerResponse updated = teamManagerService.updateTeamManager(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Team manager updated successfully"));
    }

    @PutMapping("/{id}/assign-staff")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('TEAM_MANAGER') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Assign staff to team manager")
    public ResponseEntity<ApiResponse<TeamManagerResponse>> assignStaff(
            @PathVariable Long id,
            @Valid @RequestBody AssignStaffRequest request) {
        TeamManagerResponse updated = teamManagerService.assignStaff(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Staff assigned successfully"));
    }
}