package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {
}

