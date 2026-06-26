package com.example.reportsanalyticsservice.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "sponsor_contract_offers")
public class SponsorContractOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sponsorKeycloakId; // references user-management sponsor

    private Long teamId; // references player-management team

    private Double offerAmount;

    private Integer contractDurationMonths;

    @Column(columnDefinition = "TEXT")
    private String terms;

    private String status; // PENDING, NEGOTIATING, ACCEPTED, REJECTED (ENDED is derived from endDate)

    // Whose turn it is to act in the negotiation: ADMIN or SPONSOR.
    // null once the offer reaches a terminal state (ACCEPTED / REJECTED).
    private String currentTurn;

    // Counter-offer salary proposed by the other party during negotiation (null = none).
    private Double negotiatedAmount;

    private LocalDateTime offeredAt;

    private LocalDateTime respondedAt;

    // Set when the offer is ACCEPTED (respondedAt + contractDurationMonths).
    // Once this date passes the offer is treated as ENDED/EXPIRED for display.
    private LocalDateTime endDate;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
