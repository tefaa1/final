package com.example.usermanagementservice.controller;
import com.example.usermanagementservice.dto.request.nationalTeamReq.NationalTeamRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.nationalTeamReS.NationalTeamResponse;
import com.example.usermanagementservice.dto.update.nationalTeamUp.NationalTeamUpdateRequest;
import com.example.usermanagementservice.service.nationalTeamService.NationalTeamService;
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
@RequestMapping("/national-teams")
@RequiredArgsConstructor
@Tag(name = "National Team", description = "National team operations")
class NationalTeamController {

    private final NationalTeamService nationalTeamService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create national team")
    public ResponseEntity<ApiResponse<NationalTeamResponse>> createNationalTeam(
            @Valid @RequestBody NationalTeamRequest request) {
        NationalTeamResponse response = nationalTeamService.createNationalTeam(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "National team created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('NATIONAL_TEAM') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Get national team by ID")
    public ResponseEntity<ApiResponse<NationalTeamResponse>> getNationalTeamById(@PathVariable Long id) {
        NationalTeamResponse nationalTeam = nationalTeamService.getNationalTeamById(id);
        return ResponseEntity.ok(ApiResponse.success(nationalTeam));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all national teams")
    public ResponseEntity<ApiResponse<List<NationalTeamResponse>>> getAllNationalTeams() {
        List<NationalTeamResponse> nationalTeams = nationalTeamService.getAllNationalTeams();
        return ResponseEntity.ok(ApiResponse.success(nationalTeams));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('NATIONAL_TEAM') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Update national team")
    public ResponseEntity<ApiResponse<NationalTeamResponse>> updateNationalTeam(
            @PathVariable Long id,
            @Valid @RequestBody NationalTeamUpdateRequest request) {
        NationalTeamResponse updated = nationalTeamService.updateNationalTeam(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "National team updated successfully"));
    }
}