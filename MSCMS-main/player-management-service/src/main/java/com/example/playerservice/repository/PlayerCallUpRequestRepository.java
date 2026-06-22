package com.example.playerservice.repository;

import com.example.playerservice.model.entity.PlayerCallUpRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerCallUpRequestRepository extends JpaRepository<PlayerCallUpRequest, Long> {
}

