package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.competition.Competition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompetitionRepository extends JpaRepository<Competition, Long> {
}
