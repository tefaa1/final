package com.example.notificationmessagingservice.controller;

import com.example.notificationmessagingservice.dto.request.AlertRequest;
import com.example.notificationmessagingservice.dto.response.AlertResponse;
import com.example.notificationmessagingservice.dto.validation.Create;
import com.example.notificationmessagingservice.dto.validation.Update;
import com.example.notificationmessagingservice.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<AlertResponse> create(@Validated(Create.class) @RequestBody AlertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alertService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<AlertResponse> update(@PathVariable Long id,
                                                @Validated(Update.class) @RequestBody AlertRequest request) {
        return ResponseEntity.ok(alertService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        alertService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'DOCTOR')")
    public ResponseEntity<AlertResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'DOCTOR')")
    public ResponseEntity<List<AlertResponse>> getAll() {
        return ResponseEntity.ok(alertService.getAll());
    }

    @GetMapping("/target/{keycloakId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'DOCTOR')")
    public ResponseEntity<List<AlertResponse>> getByTarget(@PathVariable String keycloakId) {
        return ResponseEntity.ok(alertService.getByTarget(keycloakId));
    }

    @GetMapping("/unacknowledged")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'DOCTOR')")
    public ResponseEntity<List<AlertResponse>> getUnacknowledged() {
        return ResponseEntity.ok(alertService.getUnacknowledged());
    }

    @PatchMapping("/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'DOCTOR')")
    public ResponseEntity<AlertResponse> acknowledge(@PathVariable Long id,
                                                     @RequestParam String acknowledgedByKeycloakId) {
        return ResponseEntity.ok(alertService.acknowledge(id, acknowledgedByKeycloakId));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH')")
    public ResponseEntity<AlertResponse> resolve(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.resolve(id));
    }
}
