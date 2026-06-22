package com.example.notificationmessagingservice.repository;

import com.example.notificationmessagingservice.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientUserKeycloakId(String keycloakId);

    List<Notification> findByRecipientUserKeycloakIdAndIsReadFalse(String keycloakId);
}
