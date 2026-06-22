package com.example.usermanagementservice.service.sponsorService;

import com.example.usermanagementservice.dto.request.sponsorReq.SponsorRequest;
import com.example.usermanagementservice.dto.response.sponsorRes.SponsorResponse;
import com.example.usermanagementservice.dto.update.sponsorUp.SponsorUpdateRequest;

import java.util.List;

public interface SponsorService {
    SponsorResponse createSponsor(SponsorRequest request);
    SponsorResponse getSponsorById(Long id);
    List<SponsorResponse> getAllSponsors();
    SponsorResponse updateSponsor(Long id, SponsorUpdateRequest request);
}
