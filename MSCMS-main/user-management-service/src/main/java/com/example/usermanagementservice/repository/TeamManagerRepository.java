package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.TeamManager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface TeamManagerRepository extends JpaRepository<TeamManager, Long> {
    Optional<TeamManager> findByKeycloakId(String keycloakId);
    List<TeamManager> findByTeamId(Long teamId);
    List<TeamManager> findBySportManager_Id(Long sportManagerId);
}