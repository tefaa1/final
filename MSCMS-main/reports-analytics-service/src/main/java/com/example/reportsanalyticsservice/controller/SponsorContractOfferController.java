package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.SponsorContractOfferRequest;
import com.example.reportsanalyticsservice.dto.response.SponsorContractOfferResponse;
import com.example.reportsanalyticsservice.dto.validation.Create;
import com.example.reportsanalyticsservice.dto.validation.Update;
import com.example.reportsanalyticsservice.service.SponsorContractOfferService;
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
    public ResponseEntity<SponsorContractOfferResponse> create(@Validated(Create.class) @RequestBody SponsorContractOfferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR','SPORT_MANAGER')")
    public ResponseEntity<SponsorContractOfferResponse> update(@PathVariable @Positive Long id, @Validated(Update.class) @RequestBody SponsorContractOfferRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR','SPORT_MANAGER','TEAM_MANAGER')")
    public ResponseEntity<SponsorContractOfferResponse> getById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SPONSOR','SPORT_MANAGER','TEAM_MANAGER')")
    public ResponseEntity<List<SponsorContractOfferResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
