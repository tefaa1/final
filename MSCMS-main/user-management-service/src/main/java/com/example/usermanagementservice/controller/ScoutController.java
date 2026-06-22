package com.example.usermanagementservice.controller;
import com.example.usermanagementservice.dto.request.scoutReq.ScoutRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.scoutRes.ScoutResponse;
import com.example.usermanagementservice.dto.update.scoutUp.ScoutUpdateRequest;
import com.example.usermanagementservice.service.scoutService.ScoutService;
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
@RequestMapping("/scouts")
@RequiredArgsConstructor
@Tag(name = "Scout", description = "Scout operations")
class ScoutController {

    private final ScoutService scoutService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create scout")
    public ResponseEntity<ApiResponse<ScoutResponse>> createScout(@Valid @RequestBody ScoutRequest request) {
        ScoutResponse response = scoutService.createScout(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Scout created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SCOUT') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Get scout by ID")
    public ResponseEntity<ApiResponse<ScoutResponse>> getScoutById(@PathVariable Long id) {
        ScoutResponse scout = scoutService.getScoutById(id);
        return ResponseEntity.ok(ApiResponse.success(scout));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all scouts")
    public ResponseEntity<ApiResponse<List<ScoutResponse>>> getAllScouts() {
        List<ScoutResponse> scouts = scoutService.getAllScouts();
        return ResponseEntity.ok(ApiResponse.success(scouts));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SCOUT') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Update scout")
    public ResponseEntity<ApiResponse<ScoutResponse>> updateScout(
            @PathVariable Long id,
            @Valid @RequestBody ScoutUpdateRequest request) {
        ScoutResponse updated = scoutService.updateScout(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Scout updated successfully"));
    }
}