package com.example.usermanagementservice.controller;
import com.example.usermanagementservice.dto.request.fanReq.FanRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.fanRes.FanResponse;
import com.example.usermanagementservice.dto.update.fanUp.FanUpdateRequest;
import com.example.usermanagementservice.service.fanService.FanService;
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
@RequestMapping("/fans")
@RequiredArgsConstructor
@Tag(name = "Fan", description = "Fan operations")
class FanController {

    private final FanService fanService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create fan")
    public ResponseEntity<ApiResponse<FanResponse>> createFan(@Valid @RequestBody FanRequest request) {
        FanResponse response = fanService.createFan(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Fan created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('FAN') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Get fan by ID")
    public ResponseEntity<ApiResponse<FanResponse>> getFanById(@PathVariable Long id) {
        FanResponse fan = fanService.getFanById(id);
        return ResponseEntity.ok(ApiResponse.success(fan));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all fans")
    public ResponseEntity<ApiResponse<List<FanResponse>>> getAllFans() {
        List<FanResponse> fans = fanService.getAllFans();
        return ResponseEntity.ok(ApiResponse.success(fans));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('FAN') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Update fan")
    public ResponseEntity<ApiResponse<FanResponse>> updateFan(
            @PathVariable Long id,
            @Valid @RequestBody FanUpdateRequest request) {
        FanResponse updated = fanService.updateFan(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Fan updated successfully"));
    }
}