package com.example.reportsanalyticsservice.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

// Counter-offer payload: the new proposed amount plus optional revised
// terms / a message appended to the offer's notes thread.
public record SponsorOfferNegotiateRequest(
        @NotNull @Positive Double amount,
        String terms,
        String message
) {}
