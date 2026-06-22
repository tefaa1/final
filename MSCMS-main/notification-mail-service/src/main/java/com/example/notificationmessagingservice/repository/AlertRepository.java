package com.example.notificationmessagingservice.repository;

import com.example.notificationmessagingservice.model.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByTargetUserKeycloakId(String keycloakId);

    List<Alert> findByIsAcknowledgedFalse();
}
