package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.staff.FitnessCoach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface FitnessCoachRepository extends JpaRepository<FitnessCoach, Long> {
    Optional<FitnessCoach> findByKeycloakId(String keycloakId);
    List<FitnessCoach> findByTeamId(Long teamId);
}
