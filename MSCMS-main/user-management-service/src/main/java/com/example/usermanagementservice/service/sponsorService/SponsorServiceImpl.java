package com.example.usermanagementservice.service.sponsorService;

import com.example.usermanagementservice.dto.request.sponsorReq.SponsorRequest;
import com.example.usermanagementservice.dto.request.userReq.UserRequest;
import com.example.usermanagementservice.dto.response.sponsorRes.SponsorResponse;
import com.example.usermanagementservice.dto.update.sponsorUp.SponsorUpdateRequest;
import com.example.usermanagementservice.exception.customException.InvalidOperationException;
import com.example.usermanagementservice.exception.customException.KeycloakException;
import com.example.usermanagementservice.exception.customException.ResourceNotFoundException;
import com.example.usermanagementservice.mapper.SponsorMapper;
import com.example.usermanagementservice.model.entity.Sponsor;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.repository.SponsorRepository;
import com.example.usermanagementservice.service.keycloakAdmin.KeycloakAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SponsorServiceImpl implements SponsorService {

    private final SponsorRepository sponsorRepository;
    private final SponsorMapper sponsorMapper;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    public SponsorResponse createSponsor(SponsorRequest request) {
        log.debug("Creating sponsor: {}", request.getUsername());

        UserRequest kr = buildKeycloakRequest(request);
        String keycloakId;
        try {
            String token = keycloakAdminService.getAdminAccessToken();
            keycloakId = keycloakAdminService.createUser(token, kr);
            keycloakAdminService.assignRealmRoleToUser(keycloakId, "SPONSOR");
        } catch (KeycloakException e) {
            throw new InvalidOperationException("Failed to create sponsor in Keycloak: " + e.getMessage());
        }

        Sponsor sponsor = sponsorMapper.toEntity(request);
        sponsor.setKeycloakId(keycloakId);
        Sponsor saved = sponsorRepository.save(sponsor);

        log.info("Sponsor created successfully: {}", saved.getId());
        return sponsorMapper.toResponse(saved);
    }

    @Override
    public SponsorResponse getSponsorById(Long id) {
        log.debug("Fetching sponsor by ID: {}", id);
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", "id", id));
        return sponsorMapper.toResponse(sponsor);
    }

    @Override
    public List<SponsorResponse> getAllSponsors() {
        log.debug("Fetching all sponsors");
        List<Sponsor> sponsors = sponsorRepository.findAll();
        return sponsorMapper.toResponseList(sponsors);
    }

    @Override
    public SponsorResponse updateSponsor(Long id, SponsorUpdateRequest request) {
        log.debug("Updating sponsor with ID: {}", id);
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", "id", id));

        sponsorMapper.updateFromDto(request, sponsor);
        Sponsor updated = sponsorRepository.save(sponsor);

        log.info("Sponsor updated successfully: {}", id);
        return sponsorMapper.toResponse(updated);
    }

    private UserRequest buildKeycloakRequest(SponsorRequest request) {
        UserRequest kr = new UserRequest();
        kr.setUsername(request.getUsername());
        kr.setEmail(request.getEmail());
        kr.setPassword(request.getPassword());
        kr.setFirstName(request.getFirstName());
        kr.setLastName(request.getLastName());
        kr.setAge(request.getAge());
        kr.setPhone(request.getPhone());
        kr.setAddress(request.getAddress());
        kr.setGender(request.getGender());
        kr.setRole(Role.SPONSOR);
        return kr;
    }
}