package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.staff.AssistantCoach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface AssistantCoachRepository extends JpaRepository<AssistantCoach, Long> {
    Optional<AssistantCoach> findByKeycloakId(String keycloakId);
    List<AssistantCoach> findByTeamId(Long teamId);
}