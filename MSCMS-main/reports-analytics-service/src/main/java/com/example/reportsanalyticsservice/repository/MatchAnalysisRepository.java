package com.example.reportsanalyticsservice.repository;

import com.example.reportsanalyticsservice.model.entity.MatchAnalysis;
import com.example.reportsanalyticsservice.model.enums.SportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchAnalysisRepository extends JpaRepository<MatchAnalysis, Long> {
    List<MatchAnalysis> findBySportType(SportType sportType);
}
