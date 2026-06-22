package com.example.notificationmessagingservice.service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import com.example.notificationmessagingservice.client.UserClient;
import com.example.notificationmessagingservice.dto.event.*;
import com.example.notificationmessagingservice.dto.response.external.UserResponse;
import com.example.notificationmessagingservice.model.entity.Notification;
import com.example.notificationmessagingservice.model.entity.Alert;
import com.example.notificationmessagingservice.model.enums.*;
import com.example.notificationmessagingservice.repository.NotificationRepository;
import com.example.notificationmessagingservice.repository.AlertRepository;
import com.example.notificationmessagingservice.service.email.EmailService;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventConsumer {

    private final NotificationRepository notificationRepository;
    private final AlertRepository alertRepository;
    private final EmailService emailService;
    private final UserClient userClient;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "injury-reported", groupId = "${spring.kafka.consumer.group-id:notification-service-group}")
    public void handleInjuryReported(String payload) {
        log.info("Received injury reported event");
        try {
            InjuryReportedEvent event = objectMapper.readValue(payload, InjuryReportedEvent.class);

            // Create alert for team manager
            Alert alert = Alert.builder()
                    .alertType(AlertType.INJURY_REPORTED)
                    .priority(mapSeverityToPriority(event.getSeverity()))
                    .title("Injury Reported: " + event.getBodyPart())
                    .message("Player injury reported - Type: " + event.getInjuryType() + ", Severity: " + event.getSeverity())
                    .description("Body Part: " + event.getBodyPart() + ", Injury Type: " + event.getInjuryType())
                    .targetUserKeycloakId(event.getPlayerKeycloakId())
                    .relatedEntityId(event.getInjuryId())
                    .relatedEntityType("INJURY")
                    .triggeredAt(LocalDateTime.now())
                    .isAcknowledged(false)
                    .isResolved(false)
                    .actionRequired("Review injury details and assign treatment")
                    .build();
            alertRepository.save(alert);

            // Send email notification to player
            try {
                UserResponse player = userClient.getUserByKeycloakId(event.getPlayerKeycloakId());
                Notification notification = Notification.builder()
                        .recipientUserKeycloakId(event.getPlayerKeycloakId())
                        .notificationType(NotificationType.BOTH)
                        .category(NotificationCategory.INJURY)
                        .status(NotificationStatus.PENDING)
                        .title("Injury Report Filed")
                        .message("An injury has been reported for you: " + event.getInjuryType() + " - " + event.getBodyPart())
                        .emailSubject("MSCMS - Injury Report Filed")
                        .emailBody(buildInjuryEmail(player.getFirstName() + " " + player.getLastName(), event))
                        .relatedEntityId(event.getInjuryId())
                        .relatedEntityType("INJURY")
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build();
                notificationRepository.save(notification);

                emailService.sendEmail(player.getEmail(), notification.getEmailSubject(), notification.getEmailBody());
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                notificationRepository.save(notification);
            } catch (Exception e) {
                log.error("Failed to send injury notification email", e);
            }

            log.info("Processed injury reported event for injury: {}", event.getInjuryId());
        } catch (Exception e) {
            log.error("Failed to process injury reported event", e);
        }
    }

    @KafkaListener(topics = "match-scheduled", groupId = "${spring.kafka.consumer.group-id:notification-service-group}")
    public void handleMatchScheduled(String payload) {
        log.info("Received match scheduled event");
        try {
            MatchScheduledEvent event = objectMapper.readValue(payload, MatchScheduledEvent.class);
            Alert alert = Alert.builder()
                    .alertType(AlertType.MATCH_UPCOMING)
                    .priority(AlertPriority.MEDIUM)
                    .title("Match Scheduled")
                    .message("New match scheduled: " + event.getMatchType() + " at " + event.getVenue())
                    .description("Kickoff: " + event.getKickoffTime())
                    .relatedEntityId(event.getMatchId())
                    .relatedEntityType("MATCH")
                    .triggeredAt(LocalDateTime.now())
                    .isAcknowledged(false)
                    .isResolved(false)
                    .build();
            alertRepository.save(alert);
            log.info("Processed match scheduled event for match: {}", event.getMatchId());
        } catch (Exception e) {
            log.error("Failed to process match scheduled event", e);
        }
    }

    @KafkaListener(topics = "match-completed", groupId = "${spring.kafka.consumer.group-id:notification-service-group}")
    public void handleMatchCompleted(String payload) {
        log.info("Received match completed event");
        try {
            MatchCompletedEvent event = objectMapper.readValue(payload, MatchCompletedEvent.class);
            Alert alert = Alert.builder()
                    .alertType(AlertType.MATCH_UPCOMING)
                    .priority(AlertPriority.LOW)
                    .title("Match Completed")
                    .message("Match finished: " + event.getHomeTeamScore() + " - " + event.getAwayTeamScore())
                    .relatedEntityId(event.getMatchId())
                    .relatedEntityType("MATCH")
                    .triggeredAt(LocalDateTime.now())
                    .isAcknowledged(false)
                    .isResolved(false)
                    .build();
            alertRepository.save(alert);
            log.info("Processed match completed event for match: {}", event.getMatchId());
        } catch (Exception e) {
            log.error("Failed to process match completed event", e);
        }
    }

    @KafkaListener(topics = "training-session-cancelled", groupId = "${spring.kafka.consumer.group-id:notification-service-group}")
    public void handleTrainingSessionCancelled(String payload) {
        log.info("Received training session cancelled event");
        try {
            TrainingSessionCancelledEvent event = objectMapper.readValue(payload, TrainingSessionCancelledEvent.class);
            Alert alert = Alert.builder()
                    .alertType(AlertType.TRAINING_CANCELLED)
                    .priority(AlertPriority.HIGH)
                    .title("Training Session Cancelled")
                    .message("Training session cancelled. Reason: " + event.getReason())
                    .relatedEntityId(event.getSessionId())
                    .relatedEntityType("TRAINING_SESSION")
                    .triggeredAt(LocalDateTime.now())
                    .isAcknowledged(false)
                    .isResolved(false)
                    .build();
            alertRepository.save(alert);
            log.info("Processed training cancelled event for session: {}", event.getSessionId());
        } catch (Exception e) {
            log.error("Failed to process training cancelled event", e);
        }
    }

    @KafkaListener(topics = "player-status-changed", groupId = "${spring.kafka.consumer.group-id:notification-service-group}")
    public void handlePlayerStatusChanged(String payload) {
        log.info("Received player status changed event");
        try {
            PlayerStatusChangedEvent event = objectMapper.readValue(payload, PlayerStatusChangedEvent.class);

            try {
                UserResponse player = userClient.getUserByKeycloakId(event.getKeycloakId());
                Notification notification = Notification.builder()
                        .recipientUserKeycloakId(event.getKeycloakId())
                        .notificationType(NotificationType.BOTH)
                        .category(NotificationCategory.SYSTEM)
                        .status(NotificationStatus.PENDING)
                        .title("Player Status Updated")
                        .message("Your status has been changed from " + event.getOldStatus() + " to " + event.getNewStatus())
                        .emailSubject("MSCMS - Player Status Updated")
                        .emailBody("Dear " + event.getFirstName() + " " + event.getLastName() + ",\n\nYour player status has been updated from " + event.getOldStatus() + " to " + event.getNewStatus() + ".\n\nBest regards,\nMSCMS")
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build();
                notificationRepository.save(notification);

                emailService.sendEmail(player.getEmail(), notification.getEmailSubject(), notification.getEmailBody());
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                notificationRepository.save(notification);
            } catch (Exception e) {
                log.error("Failed to send player status notification", e);
            }

            log.info("Processed player status changed event for player: {}", event.getKeycloakId());
        } catch (Exception e) {
            log.error("Failed to process player status changed event", e);
        }
    }

    @KafkaListener(topics = {"transfer-incoming-completed", "transfer-outgoing-completed"}, groupId = "${spring.kafka.consumer.group-id:notification-service-group}")
    public void handleTransferCompleted(String payload) {
        log.info("Received transfer completed event");
        try {
            TransferCompletedEvent event = objectMapper.readValue(payload, TransferCompletedEvent.class);
            Alert alert = Alert.builder()
                    .alertType(AlertType.TRANSFER_COMPLETED)
                    .priority(AlertPriority.HIGH)
                    .title("Transfer Completed: " + event.getTransferType())
                    .message("Player transfer completed - Type: " + event.getTransferType())
                    .targetUserKeycloakId(event.getPlayerKeycloakId())
                    .relatedEntityId(event.getTransferId())
                    .relatedEntityType("TRANSFER")
                    .triggeredAt(LocalDateTime.now())
                    .isAcknowledged(false)
                    .isResolved(false)
                    .build();
            alertRepository.save(alert);

            try {
                UserResponse player = userClient.getUserByKeycloakId(event.getPlayerKeycloakId());
                Notification notification = Notification.builder()
                        .recipientUserKeycloakId(event.getPlayerKeycloakId())
                        .notificationType(NotificationType.BOTH)
                        .category(NotificationCategory.TRANSFER)
                        .status(NotificationStatus.PENDING)
                        .title("Transfer Completed")
                        .message("Your " + event.getTransferType().toLowerCase() + " transfer has been completed.")
                        .emailSubject("MSCMS - Transfer Completed")
                        .emailBody("Dear " + player.getFirstName() + " " + player.getLastName() + ",\n\nYour " + event.getTransferType().toLowerCase() + " transfer has been completed successfully.\n\nBest regards,\nMSCMS")
                        .relatedEntityId(event.getTransferId())
                        .relatedEntityType("TRANSFER")
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build();
                notificationRepository.save(notification);

                emailService.sendEmail(player.getEmail(), notification.getEmailSubject(), notification.getEmailBody());
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                notificationRepository.save(notification);
            } catch (Exception e) {
                log.error("Failed to send transfer notification", e);
            }

            log.info("Processed transfer completed event: {}", event.getTransferId());
        } catch (Exception e) {
            log.error("Failed to process transfer completed event", e);
        }
    }

    // Helper methods
    private AlertPriority mapSeverityToPriority(String severity) {
        return switch (severity) {
            case "CRITICAL" -> AlertPriority.CRITICAL;
            case "SEVERE" -> AlertPriority.HIGH;
            case "MODERATE" -> AlertPriority.MEDIUM;
            default -> AlertPriority.LOW;
        };
    }

    private String buildInjuryEmail(String playerName, InjuryReportedEvent event) {
        return String.format(
                "Dear %s,\n\n" +
                "An injury has been reported for you.\n\n" +
                "Injury Details:\n" +
                "Type: %s\n" +
                "Severity: %s\n" +
                "Body Part: %s\n\n" +
                "Please follow up with the medical team for further assessment.\n\n" +
                "Best regards,\nMSCMS",
                playerName, event.getInjuryType(), event.getSeverity(), event.getBodyPart()
        );
    }
}
