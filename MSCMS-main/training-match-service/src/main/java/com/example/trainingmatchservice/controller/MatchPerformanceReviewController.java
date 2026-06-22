package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchPerformanceReviewRequest;
import com.example.trainingmatchservice.dto.response.MatchPerformanceReviewResponse;
import com.example.trainingmatchservice.dto.validation.Create;
import com.example.trainingmatchservice.dto.validation.Update;
import com.example.trainingmatchservice.service.MatchPerformanceReviewService;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/match-performance-reviews")
@Validated
public class MatchPerformanceReviewController {

    private final MatchPerformanceReviewService matchPerformanceReviewService;

    public MatchPerformanceReviewController(MatchPerformanceReviewService matchPerformanceReviewService) {
        this.matchPerformanceReviewService = matchPerformanceReviewService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<MatchPerformanceReviewResponse> createReview(
            @Validated(Create.class) @RequestBody MatchPerformanceReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(matchPerformanceReviewService.createMatchPerformanceReview(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST')")
    public ResponseEntity<MatchPerformanceReviewResponse> updateReview(
            @PathVariable @Positive Long id,
            @Validated(Update.class) @RequestBody MatchPerformanceReviewRequest request) {
        return ResponseEntity.ok(matchPerformanceReviewService.updateMatchPerformanceReview(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST','SPORT_MANAGER')")
    public ResponseEntity<MatchPerformanceReviewResponse> getReview(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(matchPerformanceReviewService.getMatchPerformanceReviewById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_MANAGER','HEAD_COACH','ASSISTANT_COACH','PERFORMANCE_ANALYST','SPORT_MANAGER')")
    public ResponseEntity<List<MatchPerformanceReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(matchPerformanceReviewService.getAllMatchPerformanceReviews());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_COACH')")
    public ResponseEntity<Void> deleteReview(@PathVariable @Positive Long id) {
        matchPerformanceReviewService.deleteMatchPerformanceReview(id);
        return ResponseEntity.noContent().build();
    }
}

