package com.example.usermanagementservice.repository;

import com.example.usermanagementservice.model.entity.Fan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface FanRepository extends JpaRepository<Fan, Long> {
    Optional<Fan> findByKeycloakId(String keycloakId);
    List<Fan> findByFavoriteTeamId(Long favoriteTeamId);
}