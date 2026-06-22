package com.example.usermanagementservice.controller;
import com.example.usermanagementservice.dto.request.sponsorReq.SponsorRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.sponsorRes.SponsorResponse;
import com.example.usermanagementservice.dto.update.sponsorUp.SponsorUpdateRequest;
import com.example.usermanagementservice.service.sponsorService.SponsorService;
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
@RequestMapping("/sponsors")
@RequiredArgsConstructor
@Tag(name = "Sponsor", description = "Sponsor operations")
class SponsorController {

    private final SponsorService sponsorService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create sponsor")
    public ResponseEntity<ApiResponse<SponsorResponse>> createSponsor(@Valid @RequestBody SponsorRequest request) {
        SponsorResponse response = sponsorService.createSponsor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sponsor created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SPONSOR') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Get sponsor by ID")
    public ResponseEntity<ApiResponse<SponsorResponse>> getSponsorById(@PathVariable Long id) {
        SponsorResponse sponsor = sponsorService.getSponsorById(id);
        return ResponseEntity.ok(ApiResponse.success(sponsor));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all sponsors")
    public ResponseEntity<ApiResponse<List<SponsorResponse>>> getAllSponsors() {
        List<SponsorResponse> sponsors = sponsorService.getAllSponsors();
        return ResponseEntity.ok(ApiResponse.success(sponsors));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SPONSOR') and @securityService.isCurrentUser(#id))")
    @Operation(summary = "Update sponsor")
    public ResponseEntity<ApiResponse<SponsorResponse>> updateSponsor(
            @PathVariable Long id,
            @Valid @RequestBody SponsorUpdateRequest request) {
        SponsorResponse updated = sponsorService.updateSponsor(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Sponsor updated successfully"));
    }
}
