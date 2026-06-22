package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.competition.CompetitionFixture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompetitionFixtureRepository extends JpaRepository<CompetitionFixture, Long> {
    List<CompetitionFixture> findByCompetitionId(Long competitionId);
    void deleteByCompetitionId(Long competitionId);
}
