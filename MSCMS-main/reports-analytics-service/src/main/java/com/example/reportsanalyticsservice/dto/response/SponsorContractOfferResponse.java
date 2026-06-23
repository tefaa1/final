package com.example.reportsanalyticsservice.dto.response;

import java.time.LocalDateTime;

public record SponsorContractOfferResponse(
        Long id,
        String sponsorKeycloakId,
        Long teamId,
        Double offerAmount,
        Integer contractDurationMonths,
        Double negotiatedAmount,
        String terms,
        String status,
        LocalDateTime offeredAt,
        LocalDateTime respondedAt,
        String notes
) {}
