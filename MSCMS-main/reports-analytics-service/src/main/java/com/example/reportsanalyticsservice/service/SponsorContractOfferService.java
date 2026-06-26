package com.example.reportsanalyticsservice.service;

import com.example.reportsanalyticsservice.dto.request.SponsorContractOfferRequest;
import com.example.reportsanalyticsservice.dto.request.SponsorOfferNegotiateRequest;
import com.example.reportsanalyticsservice.dto.response.SponsorContractOfferResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

public interface SponsorContractOfferService {
    SponsorContractOfferResponse create(SponsorContractOfferRequest request, HttpServletRequest http);
    SponsorContractOfferResponse update(Long id, SponsorContractOfferRequest request, HttpServletRequest http);
    void delete(Long id);
    SponsorContractOfferResponse getById(Long id, HttpServletRequest http);
    List<SponsorContractOfferResponse> getAll(HttpServletRequest http);

    // Turn-based negotiation lifecycle. Caller must be ADMIN or the owning
    // sponsor, AND it must be their turn.
    SponsorContractOfferResponse accept(Long id, HttpServletRequest http);
    SponsorContractOfferResponse reject(Long id, HttpServletRequest http);
    SponsorContractOfferResponse negotiate(Long id, SponsorOfferNegotiateRequest request, HttpServletRequest http);
}
