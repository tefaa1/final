package com.example.playerservice.repository;

import com.example.playerservice.model.entity.PlayerTransferIncoming;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerTransferIncomingRepository extends JpaRepository<PlayerTransferIncoming, Long> {
}

