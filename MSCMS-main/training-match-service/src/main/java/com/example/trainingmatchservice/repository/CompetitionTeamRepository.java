package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.competition.CompetitionTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompetitionTeamRepository extends JpaRepository<CompetitionTeam, Long> {
    List<CompetitionTeam> findByCompetitionId(Long competitionId);
    void deleteByCompetitionId(Long competitionId);
}
