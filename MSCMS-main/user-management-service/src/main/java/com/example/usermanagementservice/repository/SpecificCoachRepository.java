package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.staff.SpecificCoach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface SpecificCoachRepository extends JpaRepository<SpecificCoach, Long> {
    Optional<SpecificCoach> findByKeycloakId(String keycloakId);
    List<SpecificCoach> findByTeamId(Long teamId);
}