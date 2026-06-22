package com.example.usermanagementservice.service.sportmanager;

import com.example.usermanagementservice.dto.request.sportManagerReq.SportManagerRequest;
import com.example.usermanagementservice.dto.request.userReq.UserRequest;
import com.example.usermanagementservice.dto.response.sportMangerRes.SportManagerResponse;
import com.example.usermanagementservice.dto.response.teamManagerRes.TeamManagerResponse;
import com.example.usermanagementservice.dto.update.sportManagerUp.SportManagerUpdateRequest;
import com.example.usermanagementservice.exception.customException.DuplicateResourceException;
import com.example.usermanagementservice.exception.customException.InvalidOperationException;
import com.example.usermanagementservice.exception.customException.KeycloakException;
import com.example.usermanagementservice.exception.customException.ResourceNotFoundException;
import com.example.usermanagementservice.mapper.SportManagerMapper;
import com.example.usermanagementservice.mapper.TeamManagerMapper;
import com.example.usermanagementservice.model.entity.SportManager;
import com.example.usermanagementservice.model.entity.TeamManager;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.repository.SportManagerRepository;
import com.example.usermanagementservice.repository.TeamManagerRepository;
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
public class SportManagerServiceImpl implements SportManagerService {

    private final SportManagerRepository sportManagerRepository;
    private final TeamManagerRepository teamManagerRepository;
    private final SportManagerMapper sportManagerMapper;
    private final TeamManagerMapper teamManagerMapper;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    public SportManagerResponse createSportManager(SportManagerRequest request) {
        log.debug("Creating sport manager: {}", request.getUsername());

        // Check if email already exists
        if (sportManagerRepository.findAll().stream()
                .anyMatch(sm -> sm.getEmail().equals(request.getEmail()))) {
            throw new DuplicateResourceException("Sport Manager", "email", request.getEmail());
        }

        // Create user in Keycloak
        UserRequest keycloakRequest = buildKeycloakRequest(request);
        String keycloakId;
        try {
            String token = keycloakAdminService.getAdminAccessToken();
            keycloakId = keycloakAdminService.createUser(token, keycloakRequest);

            // Assign role
            keycloakAdminService.assignRealmRoleToUser(keycloakId, "SPORT_MANAGER");
        } catch (KeycloakException e) {
            log.error("Failed to create user in Keycloak", e);
            throw new InvalidOperationException("Failed to create user in Keycloak: " + e.getMessage());
        }

        // Create in database
        SportManager sportManager = sportManagerMapper.toEntity(request);
        sportManager.setKeycloakId(keycloakId);
        SportManager saved = sportManagerRepository.save(sportManager);

        log.info("Sport manager created successfully: {}", saved.getId());
        return sportManagerMapper.toResponse(saved);
    }

    @Override
    public SportManagerResponse getSportManagerById(Long id) {
        log.debug("Fetching sport manager by ID: {}", id);
        SportManager sportManager = sportManagerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sport Manager", "id", id));
        return sportManagerMapper.toResponse(sportManager);
    }

    @Override
    public List<SportManagerResponse> getAllSportManagers() {
        log.debug("Fetching all sport managers");
        List<SportManager> sportManagers = sportManagerRepository.findAll();
        return sportManagerMapper.toResponseList(sportManagers);
    }

    @Override
    public SportManagerResponse updateSportManager(Long id, SportManagerUpdateRequest request) {
        log.debug("Updating sport manager with ID: {}", id);
        SportManager sportManager = sportManagerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sport Manager", "id", id));

        sportManagerMapper.updateFromDto(request, sportManager);
        SportManager updated = sportManagerRepository.save(sportManager);

        log.info("Sport manager updated successfully: {}", id);
        return sportManagerMapper.toResponse(updated);
    }

    @Override
    public List<TeamManagerResponse> getTeamManagersBySportManager(Long sportManagerId) {
        log.debug("Fetching team managers for sport manager ID: {}", sportManagerId);

        // Verify sport manager exists
        if (!sportManagerRepository.existsById(sportManagerId)) {
            throw new ResourceNotFoundException("Sport Manager", "id", sportManagerId);
        }

        List<TeamManager> teamManagers = teamManagerRepository.findBySportManager_Id(sportManagerId);
        return teamManagerMapper.toResponseList(teamManagers);
    }

    private UserRequest buildKeycloakRequest(SportManagerRequest request) {
        UserRequest keycloakRequest = new UserRequest();
        keycloakRequest.setUsername(request.getUsername());
        keycloakRequest.setEmail(request.getEmail());
        keycloakRequest.setPassword(request.getPassword());
        keycloakRequest.setFirstName(request.getFirstName());
        keycloakRequest.setLastName(request.getLastName());
        keycloakRequest.setAge(request.getAge());
        keycloakRequest.setPhone(request.getPhone());
        keycloakRequest.setAddress(request.getAddress());
        keycloakRequest.setGender(request.getGender());
        keycloakRequest.setRole(Role.SPORT_MANGER);
        return keycloakRequest;
    }
}
