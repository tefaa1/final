package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.training.entity.TrainingDrill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingDrillRepository extends JpaRepository<TrainingDrill, Long> {
}

