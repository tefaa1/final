package com.example.reportsanalyticsservice.dto.request;

import com.example.reportsanalyticsservice.dto.validation.Create;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;

public record SponsorContractOfferRequest(
        @NotBlank(groups = Create.class) String sponsorKeycloakId,
        @NotNull(groups = Create.class) @Positive(groups = Create.class) Long teamId,
        @NotNull(groups = Create.class) Double offerAmount,
        @NotNull(groups = Create.class) @Positive(groups = Create.class) Integer contractDurationMonths,
        String terms,
        String status,
        LocalDateTime offeredAt,
        LocalDateTime respondedAt,
        String notes
) {}
