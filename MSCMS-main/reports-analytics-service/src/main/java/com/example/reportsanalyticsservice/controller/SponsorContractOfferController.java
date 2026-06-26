package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.SponsorContractOfferRequest;
import com.example.reportsanalyticsservice.dto.request.SponsorOfferNegotiateRequest;
import com.example.reportsanalyticsservice.dto.response.SponsorContractOfferResponse;
import com.example.reportsanalyticsservice.dto.validation.Create;
import com.example.reportsanalyticsservice.dto.validation.Update;
import com.example.reportsanalyticsservice.service.SponsorContractOfferService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/sponsor-offers")
@Validated
public class SponsorContractOfferController {

    private final SponsorContractOfferService service;

    public SponsorContractOfferController(SponsorContractOfferService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR')")
    public ResponseEntity<SponsorContractOfferResponse> create(@Validated(Create.class) @RequestBody SponsorContractOfferRequest request, HttpServletRequest http) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, http));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR','SPORT_MANAGER')")
    public ResponseEntity<SponsorContractOfferResponse> update(@PathVariable @Positive Long id, @Validated(Update.class) @RequestBody SponsorContractOfferRequest request, HttpServletRequest http) {
        return ResponseEntity.ok(service.update(id, request, http));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR','SPORT_MANAGER','TEAM_MANAGER')")
    public ResponseEntity<SponsorContractOfferResponse> getById(@PathVariable @Positive Long id, HttpServletRequest http) {
        return ResponseEntity.ok(service.getById(id, http));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR','SPORT_MANAGER','TEAM_MANAGER')")
    public ResponseEntity<List<SponsorContractOfferResponse>> getAll(HttpServletRequest http) {
        return ResponseEntity.ok(service.getAll(http));
    }

    // ── Turn-based negotiation lifecycle ──────────────────────────────────────
    // Each transition validates (in the service) that the caller is the admin or
    // the owning sponsor AND that it is their turn.

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR')")
    public ResponseEntity<SponsorContractOfferResponse> accept(@PathVariable @Positive Long id, HttpServletRequest http) {
        return ResponseEntity.ok(service.accept(id, http));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR')")
    public ResponseEntity<SponsorContractOfferResponse> reject(@PathVariable @Positive Long id, HttpServletRequest http) {
        return ResponseEntity.ok(service.reject(id, http));
    }

    @PostMapping("/{id}/negotiate")
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR')")
    public ResponseEntity<SponsorContractOfferResponse> negotiate(@PathVariable @Positive Long id, @Valid @RequestBody SponsorOfferNegotiateRequest request, HttpServletRequest http) {
        return ResponseEntity.ok(service.negotiate(id, request, http));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
