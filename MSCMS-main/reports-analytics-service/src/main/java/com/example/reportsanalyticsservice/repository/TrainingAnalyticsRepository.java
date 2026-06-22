package com.example.reportsanalyticsservice.repository;

import com.example.reportsanalyticsservice.model.entity.TrainingAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingAnalyticsRepository extends JpaRepository<TrainingAnalytics, Long> {
}
