package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.match.entity.MatchPerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchPerformanceReviewRepository extends JpaRepository<MatchPerformanceReview, Long> {
}

