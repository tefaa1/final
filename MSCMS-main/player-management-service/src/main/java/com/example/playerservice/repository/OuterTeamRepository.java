package com.example.playerservice.repository;

import com.example.playerservice.model.entity.OuterTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OuterTeamRepository extends JpaRepository<OuterTeam, Long> {
}

