package com.example.reportsanalyticsservice.service;

import com.example.reportsanalyticsservice.dto.request.SponsorContractOfferRequest;
import com.example.reportsanalyticsservice.dto.response.SponsorContractOfferResponse;
import java.util.List;

public interface SponsorContractOfferService {
    SponsorContractOfferResponse create(SponsorContractOfferRequest request);
    SponsorContractOfferResponse update(Long id, SponsorContractOfferRequest request);
    void delete(Long id);
    SponsorContractOfferResponse getById(Long id);
    List<SponsorContractOfferResponse> getAll();
}
