package com.example.playerservice.repository;

import com.example.playerservice.model.entity.Roster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RosterRepository extends JpaRepository<Roster, Long> {
}

