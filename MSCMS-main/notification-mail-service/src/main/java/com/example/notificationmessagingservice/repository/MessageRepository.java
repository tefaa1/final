package com.example.notificationmessagingservice.repository;

import com.example.notificationmessagingservice.model.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByRecipientUserKeycloakId(String keycloakId);

    List<Message> findBySenderUserKeycloakId(String keycloakId);

    // A group conversation stores one row per sent message (tagged with groupId).
    // Fetching by groupId returns the whole thread so EVERY member sees it —
    // delivery is no longer tied to a single recipient.
    List<Message> findByGroupIdOrderBySentAtAsc(Long groupId);
}
