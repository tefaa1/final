package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.dto.request.MatchPerformanceReviewRequest;
import com.example.trainingmatchservice.dto.response.MatchPerformanceReviewResponse;

import java.util.List;

public interface MatchPerformanceReviewService {
    MatchPerformanceReviewResponse createMatchPerformanceReview(MatchPerformanceReviewRequest request);
    MatchPerformanceReviewResponse updateMatchPerformanceReview(Long id, MatchPerformanceReviewRequest request);
    void deleteMatchPerformanceReview(Long id);
    MatchPerformanceReviewResponse getMatchPerformanceReviewById(Long id);
    List<MatchPerformanceReviewResponse> getAllMatchPerformanceReviews();
}

