package com.example.playerservice.controller;

import com.example.playerservice.dto.request.OuterPlayerRequest;
import com.example.playerservice.dto.response.OuterPlayerResponse;
import com.example.playerservice.dto.validation.Create;
import com.example.playerservice.dto.validation.Update;
import com.example.playerservice.service.OuterPlayerService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/outer-players")
@Validated
public class OuterPlayerController {

    private final OuterPlayerService outerPlayerService;

    public OuterPlayerController(OuterPlayerService outerPlayerService) {
        this.outerPlayerService = outerPlayerService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SCOUT')")
    public ResponseEntity<OuterPlayerResponse> createOuterPlayer(
            @Validated(Create.class) @RequestBody OuterPlayerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(outerPlayerService.createOuterPlayer(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SCOUT')")
    public ResponseEntity<OuterPlayerResponse> updateOuterPlayer(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody OuterPlayerRequest request) {
        return ResponseEntity.ok(outerPlayerService.updateOuterPlayer(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SCOUT', 'SPORT_MANAGER')")
    public ResponseEntity<OuterPlayerResponse> getOuterPlayer(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(outerPlayerService.getOuterPlayerById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SCOUT', 'SPORT_MANAGER')")
    public ResponseEntity<List<OuterPlayerResponse>> getAllOuterPlayers() {
        return ResponseEntity.ok(outerPlayerService.getAllOuterPlayers());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteOuterPlayer(@PathVariable @Positive Long id) {
        outerPlayerService.deleteOuterPlayer(id);
        return ResponseEntity.noContent().build();
    }
}

