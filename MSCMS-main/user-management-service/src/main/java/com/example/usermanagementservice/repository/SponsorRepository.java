package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.Sponsor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface SponsorRepository extends JpaRepository<Sponsor, Long> {
    Optional<Sponsor> findByKeycloakId(String keycloakId);
    Optional<Sponsor> findByCompanyName(String companyName);
}