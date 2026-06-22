package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.TrainingAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.TrainingAnalyticsResponse;
import com.example.reportsanalyticsservice.dto.validation.Create;
import com.example.reportsanalyticsservice.dto.validation.Update;
import com.example.reportsanalyticsservice.service.TrainingAnalyticsService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/training-analytics")
@Validated
public class TrainingAnalyticsController {

    private final TrainingAnalyticsService service;

    public TrainingAnalyticsController(TrainingAnalyticsService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST')")
    public ResponseEntity<TrainingAnalyticsResponse> create(@Validated(Create.class) @RequestBody TrainingAnalyticsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST')")
    public ResponseEntity<TrainingAnalyticsResponse> update(@PathVariable @Positive Long id, @Validated(Update.class) @RequestBody TrainingAnalyticsRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH','FITNESS_COACH')")
    public ResponseEntity<TrainingAnalyticsResponse> getById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PERFORMANCE_ANALYST','HEAD_COACH','FITNESS_COACH')")
    public ResponseEntity<List<TrainingAnalyticsResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
