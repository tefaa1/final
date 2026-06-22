package com.example.reportsanalyticsservice.repository;

import com.example.reportsanalyticsservice.model.entity.PlayerAnalytics;
import com.example.reportsanalyticsservice.model.enums.SportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlayerAnalyticsRepository extends JpaRepository<PlayerAnalytics, Long> {
    List<PlayerAnalytics> findBySportType(SportType sportType);
}
