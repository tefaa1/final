package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.training.entity.PlayerTrainingAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerTrainingAssessmentRepository extends JpaRepository<PlayerTrainingAssessment, Long> {
}

