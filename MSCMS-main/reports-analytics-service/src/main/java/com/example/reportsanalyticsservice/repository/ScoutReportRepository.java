package com.example.reportsanalyticsservice.repository;

import com.example.reportsanalyticsservice.model.entity.ScoutReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoutReportRepository extends JpaRepository<ScoutReport, Long> {
}
