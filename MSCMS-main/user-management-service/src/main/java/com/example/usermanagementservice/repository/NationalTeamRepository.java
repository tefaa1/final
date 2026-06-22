package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.NationalTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;


@Repository
public interface NationalTeamRepository extends JpaRepository<NationalTeam, Long> {
    Optional<NationalTeam> findByKeycloakId(String keycloakId);
    Optional<NationalTeam> findByCountry(String country);
}
