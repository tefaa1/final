package com.example.usermanagementservice.service.nationalTeamService;

import com.example.usermanagementservice.dto.request.nationalTeamReq.NationalTeamRequest;
import com.example.usermanagementservice.dto.request.userReq.UserRequest;
import com.example.usermanagementservice.dto.response.nationalTeamReS.NationalTeamResponse;
import com.example.usermanagementservice.dto.update.nationalTeamUp.NationalTeamUpdateRequest;
import com.example.usermanagementservice.exception.customException.InvalidOperationException;
import com.example.usermanagementservice.exception.customException.KeycloakException;
import com.example.usermanagementservice.exception.customException.ResourceNotFoundException;
import com.example.usermanagementservice.mapper.NationalTeamMapper;
import com.example.usermanagementservice.model.entity.NationalTeam;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.repository.NationalTeamRepository;
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
public class NationalTeamServiceImpl implements NationalTeamService {

    private final NationalTeamRepository nationalTeamRepository;
    private final NationalTeamMapper nationalTeamMapper;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    public NationalTeamResponse createNationalTeam(NationalTeamRequest request) {
        log.debug("Creating national team: {}", request.getUsername());

        UserRequest kr = buildKeycloakRequest(request);
        String keycloakId;
        try {
            String token = keycloakAdminService.getAdminAccessToken();
            keycloakId = keycloakAdminService.createUser(token, kr);
            keycloakAdminService.assignRealmRoleToUser(keycloakId, "NATIONAL_TEAM");
        } catch (KeycloakException e) {
            throw new InvalidOperationException("Failed to create national team in Keycloak: " + e.getMessage());
        }

        NationalTeam nationalTeam = nationalTeamMapper.toEntity(request);
        nationalTeam.setKeycloakId(keycloakId);
        NationalTeam saved = nationalTeamRepository.save(nationalTeam);

        log.info("National team created successfully: {}", saved.getId());
        return nationalTeamMapper.toResponse(saved);
    }

    @Override
    public NationalTeamResponse getNationalTeamById(Long id) {
        log.debug("Fetching national team by ID: {}", id);
        NationalTeam nationalTeam = nationalTeamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("National Team", "id", id));
        return nationalTeamMapper.toResponse(nationalTeam);
    }

    @Override
    public List<NationalTeamResponse> getAllNationalTeams() {
        log.debug("Fetching all national teams");
        List<NationalTeam> nationalTeams = nationalTeamRepository.findAll();
        return nationalTeamMapper.toResponseList(nationalTeams);
    }

    @Override
    public NationalTeamResponse updateNationalTeam(Long id, NationalTeamUpdateRequest request) {
        log.debug("Updating national team with ID: {}", id);
        NationalTeam nationalTeam = nationalTeamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("National Team", "id", id));

        nationalTeamMapper.updateFromDto(request, nationalTeam);
        NationalTeam updated = nationalTeamRepository.save(nationalTeam);

        log.info("National team updated successfully: {}", id);
        return nationalTeamMapper.toResponse(updated);
    }

    private UserRequest buildKeycloakRequest(NationalTeamRequest request) {
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
        kr.setRole(Role.NATIONAL_TEAM);
        return kr;
    }
}