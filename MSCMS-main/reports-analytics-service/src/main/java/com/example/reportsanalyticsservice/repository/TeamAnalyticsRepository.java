package com.example.reportsanalyticsservice.repository;

import com.example.reportsanalyticsservice.model.entity.TeamAnalytics;
import com.example.reportsanalyticsservice.model.enums.SportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TeamAnalyticsRepository extends JpaRepository<TeamAnalytics, Long> {
    List<TeamAnalytics> findBySportType(SportType sportType);
}
