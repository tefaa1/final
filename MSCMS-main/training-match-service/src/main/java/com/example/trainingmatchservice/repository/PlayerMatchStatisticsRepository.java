package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.match.entity.PlayerMatchStatistics;
import com.example.trainingmatchservice.model.match.enums.SportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerMatchStatisticsRepository extends JpaRepository<PlayerMatchStatistics, Long> {
    List<PlayerMatchStatistics> findByMatchId(Long matchId);
    List<PlayerMatchStatistics> findBySportType(SportType sportType);
}

