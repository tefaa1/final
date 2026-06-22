package com.example.trainingmatchservice.repository;

import com.example.trainingmatchservice.model.training.entity.TrainingAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingAttendanceRepository extends JpaRepository<TrainingAttendance, Long> {
}

