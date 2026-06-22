package com.example.usermanagementservice.repository;
import com.example.usermanagementservice.model.entity.staff.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByKeycloakId(String keycloakId);
    List<Doctor> findByTeamId(Long teamId);
}
