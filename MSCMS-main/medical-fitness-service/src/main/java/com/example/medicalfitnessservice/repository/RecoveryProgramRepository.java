package com.example.medicalfitnessservice.repository;

import com.example.medicalfitnessservice.model.entity.RecoveryProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecoveryProgramRepository extends JpaRepository<RecoveryProgram, Long> {
}

