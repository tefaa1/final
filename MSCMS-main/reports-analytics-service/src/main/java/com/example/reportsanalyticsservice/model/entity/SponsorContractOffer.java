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

    private String status; // e.g., PENDING, ACCEPTED, REJECTED, EXPIRED

    private LocalDateTime offeredAt;

    private LocalDateTime respondedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
