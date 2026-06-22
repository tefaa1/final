package com.example.medicalfitnessservice.repository;

import com.example.medicalfitnessservice.model.entity.FitnessTest;
import com.example.medicalfitnessservice.model.enums.SportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FitnessTestRepository extends JpaRepository<FitnessTest, Long> {
    List<FitnessTest> findBySportType(SportType sportType);
}

