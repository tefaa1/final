package com.example.notificationmessagingservice.bootstrap;

import com.example.notificationmessagingservice.model.entity.Alert;
import com.example.notificationmessagingservice.model.entity.Message;
import com.example.notificationmessagingservice.model.entity.Notification;
import com.example.notificationmessagingservice.model.enums.*;
import com.example.notificationmessagingservice.repository.AlertRepository;
import com.example.notificationmessagingservice.repository.MessageRepository;
import com.example.notificationmessagingservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class NotificationDataSeeder implements CommandLineRunner {

    // Cross-service Keycloak UUIDs — match user-mgmt seed
    private static final String ADMIN_KC       = "00000000-0000-0000-0000-000000000001";
    private static final String HEAD_COACH_KC  = "00000000-0000-0000-0000-000000000020";
    private static final String DOCTOR_KC      = "00000000-0000-0000-0000-000000000030";
    private static final String PLAYER_3_KC    = "00000000-0000-0000-0000-000000000103"; // Araújo
    private static final String PLAYER_5_KC    = "00000000-0000-0000-0000-000000000105"; // Satoranský
    private static final String SPORT_MANAGER_KC = "00000000-0000-0000-0000-000000000010"; // Laporta
    private static final String TEAM_MANAGER_KC  = "00000000-0000-0000-0000-000000000011"; // Deco
    private static final String PHYSIO_KC        = "00000000-0000-0000-0000-000000000031"; // Brau

    private final AlertRepository alertRepository;
    private final NotificationRepository notificationRepository;
    private final MessageRepository messageRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Per-table idempotent guards (the previous whole-method guard
        // skipped everything once either table had a row — that meant
        // adding alerts later was impossible without wiping the volume).
        log.info("[SEED] Seeding notification-mail-service (per-table idempotent)...");

        LocalDateTime now = LocalDateTime.now();

        // ─── Alerts ────────────────────────────────────────────────────────
        if (alertRepository.count() == 0) {
        saveAlert(AlertType.INJURY_REPORTED, AlertPriority.HIGH,
                "New Injury: R. Araújo",
                "Ronald Araújo flagged with a Grade II ankle ligament sprain.",
                "MRI confirms partial tear of ATFL. Expected return: 2–3 weeks.",
                DOCTOR_KC, "TEAM_DOCTOR", 1L, "Injury",
                now.minusDays(10), "Review rehab plan with medical staff");

        saveAlert(AlertType.MATCH_UPCOMING, AlertPriority.MEDIUM,
                "Upcoming Fixture: vs Atlético de Madrid",
                "La Liga home fixture on " + now.plusDays(7).toLocalDate(),
                "Spotify Camp Nou — kickoff 21:00 CET.",
                null, "STAFF", 2L, "Match",
                now.minusDays(1), "Confirm matchday squad and travel logistics");

        saveAlert(AlertType.CONTRACT_EXPIRING, AlertPriority.HIGH,
                "Contract Renewal: Pedri",
                "Pedri's contract is scheduled for review.",
                "Current deal ends in 18 months — renewal talks recommended.",
                ADMIN_KC, "ADMIN", 2L, "PlayerContract",
                now.minusHours(6), "Open renewal negotiations");

        saveAlert(AlertType.SCOUT_REPORT_SUBMITTED, AlertPriority.LOW,
                "New Scout Report",
                "Scout Jordi Roura submitted a new prospect report.",
                "Premier League striker, 22 y/o — strong recommendation.",
                HEAD_COACH_KC, "HEAD_COACH", 1L, "ScoutReport",
                now.minusHours(2), "Review report and decide on next steps");
        }

        // ─── Notifications (these feed the Dashboard "Recent Activity" panel) ──
        if (notificationRepository.count() == 0) {
        saveNotification(ADMIN_KC, NotificationType.IN_APP, NotificationCategory.INJURY,
                NotificationStatus.DELIVERED,
                "Injury report filed",
                "R. Araújo — Grade II ankle sprain. Medical staff notified.",
                1L, "Injury", now.minusDays(10), null, false);

        saveNotification(ADMIN_KC, NotificationType.IN_APP, NotificationCategory.MATCH_REMINDER,
                NotificationStatus.DELIVERED,
                "El Clásico kicks off in 5 days",
                "FC Barcelona vs Real Madrid CF — Spotify Camp Nou.",
                1L, "Match", now.minusDays(8), null, false);

        saveNotification(ADMIN_KC, NotificationType.IN_APP, NotificationCategory.REPORT_READY,
                NotificationStatus.DELIVERED,
                "Match analysis ready: El Clásico",
                "Tactical breakdown of the 2-1 win is available in Reports.",
                1L, "MatchAnalysis", now.minusDays(4), now.minusDays(3), true);

        saveNotification(ADMIN_KC, NotificationType.IN_APP, NotificationCategory.TRANSFER,
                NotificationStatus.SENT,
                "Incoming transfer request",
                "Real Madrid striker target — review the offer in Transfers.",
                1L, "PlayerTransferIncoming", now.minusDays(8), null, false);

        saveNotification(HEAD_COACH_KC, NotificationType.IN_APP, NotificationCategory.TRAINING_REMINDER,
                NotificationStatus.DELIVERED,
                "Training tomorrow: VO2 max + sprints",
                "Ciutat Esportiva Joan Gamper — 60 minutes.",
                2L, "TrainingSession", now.minusHours(20), null, false);
        }

        // ─── Messages (internal staff inbox/threads) ───────────────────────
        if (messageRepository.count() == 0) {
            saveMessage(DOCTOR_KC, HEAD_COACH_KC,
                    "Araújo — medical update",
                    "Hi Hansi, MRI confirms a Grade II ATFL sprain. We're targeting a 2–3 week return. I'll keep you posted after the next assessment.",
                    MessageStatus.READ, now.minusDays(10), now.minusDays(10), now.minusDays(9));
            saveMessage(HEAD_COACH_KC, DOCTOR_KC,
                    "Re: Araújo — medical update",
                    "Thanks Ricard. Let's not rush him before El Clásico. Keep me in the loop on the rehab milestones.",
                    MessageStatus.READ, now.minusDays(9), now.minusDays(9), now.minusDays(9));
            saveMessage(SPORT_MANAGER_KC, TEAM_MANAGER_KC,
                    "Squad planning meeting",
                    "Deco, let's align on the winter window targets and contract renewals (Pedri priority). Thursday 11:00?",
                    MessageStatus.READ, now.minusDays(6), now.minusDays(6), now.minusDays(5));
            saveMessage(HEAD_COACH_KC, PHYSIO_KC,
                    "Load management — Gündoğan",
                    "Please prepare an individual recovery session for İlkay this week, manage his minutes carefully.",
                    MessageStatus.DELIVERED, now.minusDays(3), now.minusDays(3), null);
            saveMessage(ADMIN_KC, HEAD_COACH_KC,
                    "Welcome to MSCMS",
                    "The new club management system is live. Your squad, training and match modules are ready to use.",
                    MessageStatus.SENT, now.minusDays(1), null, null);
        }

        log.info("[SEED] notification-mail seeded: alerts={}, notifications={}, messages={}",
                alertRepository.count(), notificationRepository.count(), messageRepository.count());
    }

    private Message saveMessage(String senderKc, String recipientKc,
                                String subject, String content, MessageStatus status,
                                LocalDateTime sentAt, LocalDateTime deliveredAt, LocalDateTime readAt) {
        Message m = new Message();
        m.setSenderUserKeycloakId(senderKc);
        m.setRecipientUserKeycloakId(recipientKc);
        m.setSubject(subject);
        m.setContent(content);
        m.setStatus(status);
        m.setSentAt(sentAt);
        m.setDeliveredAt(deliveredAt);
        m.setReadAt(readAt);
        return messageRepository.save(m);
    }

    private Alert saveAlert(AlertType type, AlertPriority priority,
                            String title, String message, String description,
                            String targetUser, String targetRole,
                            Long relatedId, String relatedType,
                            LocalDateTime triggeredAt, String actionRequired) {
        Alert a = Alert.builder()
                .alertType(type)
                .priority(priority)
                .title(title)
                .message(message)
                .description(description)
                .targetUserKeycloakId(targetUser)
                .targetRole(targetRole)
                .relatedEntityId(relatedId)
                .relatedEntityType(relatedType)
                .triggeredAt(triggeredAt)
                .isAcknowledged(false)
                .isResolved(false)
                .actionRequired(actionRequired)
                .build();
        return alertRepository.save(a);
    }

    private Notification saveNotification(String recipientKc, NotificationType type,
                                          NotificationCategory category, NotificationStatus status,
                                          String title, String message,
                                          Long relatedId, String relatedType,
                                          LocalDateTime createdAt, LocalDateTime readAt,
                                          boolean isRead) {
        Notification n = Notification.builder()
                .recipientUserKeycloakId(recipientKc)
                .notificationType(type)
                .category(category)
                .status(status)
                .title(title)
                .message(message)
                .relatedEntityId(relatedId)
                .relatedEntityType(relatedType)
                .createdAt(createdAt)
                .sentAt(createdAt)
                .readAt(readAt)
                .isRead(isRead)
                .build();
        return notificationRepository.save(n);
    }
}
