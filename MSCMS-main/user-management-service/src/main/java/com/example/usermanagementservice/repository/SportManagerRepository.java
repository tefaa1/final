package com.example.usermanagementservice.repository;

import com.example.usermanagementservice.model.entity.SportManager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface SportManagerRepository extends JpaRepository<SportManager, Long> {
    Optional<SportManager> findByKeycloakId(String keycloakId);
    List<SportManager> findBySportId(Long sportId);
}