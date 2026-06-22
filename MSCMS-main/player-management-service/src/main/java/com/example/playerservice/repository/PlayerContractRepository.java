package com.example.playerservice.repository;

import com.example.playerservice.model.entity.PlayerContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerContractRepository extends JpaRepository<PlayerContract, Long> {
}

