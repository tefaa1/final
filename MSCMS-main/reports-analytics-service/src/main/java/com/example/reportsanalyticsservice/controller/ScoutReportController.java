package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.ScoutReportRequest;
import com.example.reportsanalyticsservice.dto.response.ScoutReportResponse;
import com.example.reportsanalyticsservice.dto.validation.Create;
import com.example.reportsanalyticsservice.dto.validation.Update;
import com.example.reportsanalyticsservice.service.ScoutReportService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/scout-reports")
@Validated
public class ScoutReportController {

    private final ScoutReportService service;

    public ScoutReportController(ScoutReportService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SCOUT')")
    public ResponseEntity<ScoutReportResponse> create(@Validated(Create.class) @RequestBody ScoutReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SCOUT')")
    public ResponseEntity<ScoutReportResponse> update(@PathVariable @Positive Long id, @Validated(Update.class) @RequestBody ScoutReportRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SCOUT','SPORT_MANAGER')")
    public ResponseEntity<ScoutReportResponse> getById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SCOUT','SPORT_MANAGER')")
    public ResponseEntity<List<ScoutReportResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SCOUT')")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
