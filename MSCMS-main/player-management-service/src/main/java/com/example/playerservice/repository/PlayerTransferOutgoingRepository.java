package com.example.playerservice.repository;

import com.example.playerservice.model.entity.PlayerTransferOutgoing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerTransferOutgoingRepository extends JpaRepository<PlayerTransferOutgoing, Long> {
}

