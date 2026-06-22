package com.example.medicalfitnessservice.repository;

import com.example.medicalfitnessservice.model.entity.Rehabilitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RehabilitationRepository extends JpaRepository<Rehabilitation, Long> {
}

