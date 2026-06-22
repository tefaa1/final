package com.example.notificationmessagingservice.model.entity;

import com.example.notificationmessagingservice.model.enums.AlertPriority;
import com.example.notificationmessagingservice.model.enums.AlertType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private AlertType alertType;

    @Enumerated(EnumType.STRING)
    private AlertPriority priority;

    private String title;
    private String message;
    private String description;

    private String targetUserKeycloakId;  // Who should receive this alert (Keycloak ID, optional - can be role-based)
    private String targetRole;  // Role that should receive this alert (e.g., "COACH", "DOCTOR")

    private Long relatedEntityId;  // ID of related entity (injury, player, report, etc.)
    private String relatedEntityType;  // Type of related entity

    private LocalDateTime triggeredAt;
    private LocalDateTime acknowledgedAt;
    private String acknowledgedByUserKeycloakId;  // Who acknowledged the alert (Keycloak ID)

    private Boolean isAcknowledged;
    private Boolean isResolved;
    private LocalDateTime resolvedAt;

    private String actionRequired;  // What action is needed
    private String metadata;  // Additional alert data (JSON string)
}

