package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.match.entity.MatchLineup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchLineupRepository extends JpaRepository<MatchLineup, Long> {
}

