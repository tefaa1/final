package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchEventRequest;
import com.example.trainingmatchservice.dto.response.MatchEventResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.service.MatchEventService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/match-events")
@Validated
public class MatchEventController {

    private final MatchEventService matchEventService;

    public MatchEventController(MatchEventService matchEventService) {
        this.matchEventService = matchEventService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH')")
    public ResponseEntity<MatchEventResponse> createMatchEvent(
            @Validated(Create.class) @RequestBody MatchEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(matchEventService.createMatchEvent(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH')")
    public ResponseEntity<MatchEventResponse> updateMatchEvent(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody MatchEventRequest request) {
        return ResponseEntity.ok(matchEventService.updateMatchEvent(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<MatchEventResponse> getMatchEvent(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(matchEventService.getMatchEventById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','SPORT_MANAGER','PERFORMANCE_ANALYST')")
    public ResponseEntity<List<MatchEventResponse>> getAllMatchEvents() {
        return ResponseEntity.ok(matchEventService.getAllMatchEvents());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH')")
    public ResponseEntity<Void> deleteMatchEvent(@PathVariable @Positive Long id) {
        matchEventService.deleteMatchEvent(id);
        return ResponseEntity.noContent().build();
    }
}

