package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.Player;
import com.example.usermanagementservice.model.enums.StatusOfPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    Optional<Player> findByKeycloakId(String keycloakId);
    List<Player> findByRosterId(Long rosterId);
    List<Player> findByStatus(StatusOfPlayer status);
    boolean existsByKitNumber(Integer kitNumber);

}
