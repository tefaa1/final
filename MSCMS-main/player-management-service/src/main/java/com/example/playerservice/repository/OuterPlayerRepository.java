package com.example.playerservice.repository;

import com.example.playerservice.model.entity.OuterPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OuterPlayerRepository extends JpaRepository<OuterPlayer, Long> {
}

