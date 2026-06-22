package com.example.playerservice.repository;

import com.example.playerservice.model.entity.Sport;
import com.example.playerservice.model.enums.SportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SportRepository extends JpaRepository<Sport, Long> {
    List<Sport> findBySportType(SportType sportType);
}
