package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.staff.HeadCoach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface HeadCoachRepository extends JpaRepository<HeadCoach, Long> {
    Optional<HeadCoach> findByKeycloakId(String keycloakId);
    List<HeadCoach> findByTeamId(Long teamId);
}