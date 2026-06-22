package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.match.entity.MatchFormation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchFormationRepository extends JpaRepository<MatchFormation, Long> {
}

