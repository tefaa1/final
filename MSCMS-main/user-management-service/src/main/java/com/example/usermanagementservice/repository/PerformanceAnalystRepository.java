package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.staff.PerformanceAnalyst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface PerformanceAnalystRepository extends JpaRepository<PerformanceAnalyst, Long> {
    Optional<PerformanceAnalyst> findByKeycloakId(String keycloakId);
    List<PerformanceAnalyst> findByTeamId(Long teamId);
}
