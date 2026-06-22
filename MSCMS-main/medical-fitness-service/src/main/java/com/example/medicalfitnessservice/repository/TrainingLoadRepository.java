package com.example.medicalfitnessservice.repository;

import com.example.medicalfitnessservice.model.entity.TrainingLoad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingLoadRepository extends JpaRepository<TrainingLoad, Long> {
}

