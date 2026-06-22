package com.example.notificationmessagingservice.controller;

import com.example.notificationmessagingservice.dto.request.MessageRequest;
import com.example.notificationmessagingservice.dto.response.MessageResponse;
import com.example.notificationmessagingservice.dto.validation.Create;
import com.example.notificationmessagingservice.dto.validation.Update;
import com.example.notificationmessagingservice.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'SPORT_MANAGER', 'DOCTOR')")
    public ResponseEntity<MessageResponse> create(@Validated(Create.class) @RequestBody MessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<MessageResponse> update(@PathVariable Long id,
                                                  @Validated(Update.class) @RequestBody MessageRequest request) {
        return ResponseEntity.ok(messageService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        messageService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'SPORT_MANAGER', 'DOCTOR')")
    public ResponseEntity<MessageResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<List<MessageResponse>> getAll() {
        return ResponseEntity.ok(messageService.getAll());
    }

    @GetMapping("/recipient/{keycloakId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'SPORT_MANAGER', 'PLAYER', 'DOCTOR', 'FITNESS_COACH')")
    public ResponseEntity<List<MessageResponse>> getByRecipient(@PathVariable String keycloakId) {
        return ResponseEntity.ok(messageService.getByRecipient(keycloakId));
    }

    @GetMapping("/sender/{keycloakId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'HEAD_COACH', 'SPORT_MANAGER', 'DOCTOR')")
    public ResponseEntity<List<MessageResponse>> getBySender(@PathVariable String keycloakId) {
        return ResponseEntity.ok(messageService.getBySender(keycloakId));
    }
}
