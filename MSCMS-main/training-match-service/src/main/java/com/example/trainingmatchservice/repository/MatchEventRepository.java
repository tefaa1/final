package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.match.entity.MatchEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchEventRepository extends JpaRepository<MatchEvent, Long> {
}

