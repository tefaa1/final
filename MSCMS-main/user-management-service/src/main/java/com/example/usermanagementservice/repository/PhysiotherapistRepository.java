package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.staff.Physiotherapist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface PhysiotherapistRepository extends JpaRepository<Physiotherapist, Long> {
    Optional<Physiotherapist> findByKeycloakId(String keycloakId);
    List<Physiotherapist> findByTeamId(Long teamId);
}
