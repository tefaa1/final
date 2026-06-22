package com.example.notificationmessagingservice.model.entity;

import com.example.notificationmessagingservice.model.enums.NotificationCategory;
import com.example.notificationmessagingservice.model.enums.NotificationStatus;
import com.example.notificationmessagingservice.model.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recipientUserKeycloakId;  // Reference to User (Keycloak ID)

    @Enumerated(EnumType.STRING)
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    private NotificationCategory category;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status;

    private String title;
    private String message;
    private String emailSubject;  // If email notification
    private String emailBody;  // If email notification

    private Long relatedEntityId;  // ID of related entity (injury, report, etc.)
    private String relatedEntityType;  // Type of related entity (e.g., "Injury", "Report")

    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;

    private String actionUrl;  // URL for user to take action
    private Boolean isRead;
}

