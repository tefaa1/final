package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.enums.SportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findBySportType(SportType sportType);
    Optional<Match> findByExternalId(Long externalId);
}

