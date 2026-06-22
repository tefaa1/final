package com.example.notificationmessagingservice.controller;

import com.example.notificationmessagingservice.dto.request.NotificationRequest;
import com.example.notificationmessagingservice.dto.response.NotificationResponse;
import com.example.notificationmessagingservice.dto.validation.Create;
import com.example.notificationmessagingservice.dto.validation.Update;
import com.example.notificationmessagingservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<NotificationResponse> create(@Validated(Create.class) @RequestBody NotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<NotificationResponse> update(@PathVariable Long id,
                                                       @Validated(Update.class) @RequestBody NotificationRequest request) {
        return ResponseEntity.ok(notificationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'SPORT_MANAGER')")
    public ResponseEntity<NotificationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<List<NotificationResponse>> getAll() {
        return ResponseEntity.ok(notificationService.getAll());
    }

    @GetMapping("/recipient/{keycloakId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'SPORT_MANAGER', 'PLAYER', 'DOCTOR', 'FITNESS_COACH', 'SCOUT', 'SPONSOR')")
    public ResponseEntity<List<NotificationResponse>> getByRecipient(@PathVariable String keycloakId) {
        return ResponseEntity.ok(notificationService.getByRecipient(keycloakId));
    }

    @GetMapping("/recipient/{keycloakId}/unread")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'SPORT_MANAGER', 'PLAYER', 'DOCTOR', 'FITNESS_COACH', 'SCOUT', 'SPONSOR')")
    public ResponseEntity<List<NotificationResponse>> getUnreadByRecipient(@PathVariable String keycloakId) {
        return ResponseEntity.ok(notificationService.getUnreadByRecipient(keycloakId));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'SPORT_MANAGER', 'PLAYER', 'DOCTOR', 'FITNESS_COACH', 'SCOUT', 'SPONSOR')")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }
}
