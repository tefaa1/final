package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.Scout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface ScoutRepository extends JpaRepository<Scout, Long> {
    Optional<Scout> findByKeycloakId(String keycloakId);
    List<Scout> findByRegion(String region);
}
