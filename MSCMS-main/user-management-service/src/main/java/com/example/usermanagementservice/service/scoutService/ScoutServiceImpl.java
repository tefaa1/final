package com.example.usermanagementservice.service.scoutService;

import com.example.usermanagementservice.dto.request.scoutReq.ScoutRequest;
import com.example.usermanagementservice.dto.request.userReq.UserRequest;
import com.example.usermanagementservice.dto.response.scoutRes.ScoutResponse;
import com.example.usermanagementservice.dto.update.scoutUp.ScoutUpdateRequest;
import com.example.usermanagementservice.exception.customException.InvalidOperationException;
import com.example.usermanagementservice.exception.customException.KeycloakException;
import com.example.usermanagementservice.exception.customException.ResourceNotFoundException;
import com.example.usermanagementservice.mapper.ScoutMapper;
import com.example.usermanagementservice.model.entity.Scout;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.repository.ScoutRepository;
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
public class ScoutServiceImpl implements ScoutService {

    private final ScoutRepository scoutRepository;
    private final ScoutMapper scoutMapper;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    public ScoutResponse createScout(ScoutRequest request) {
        log.debug("Creating scout: {}", request.getUsername());

        UserRequest kr = buildKeycloakRequest(request);
        String keycloakId;
        try {
            String token = keycloakAdminService.getAdminAccessToken();
            keycloakId = keycloakAdminService.createUser(token, kr);
            keycloakAdminService.assignRealmRoleToUser(keycloakId, "SCOUT");
        } catch (KeycloakException e) {
            throw new InvalidOperationException("Failed to create scout in Keycloak: " + e.getMessage());
        }

        Scout scout = scoutMapper.toEntity(request);
        scout.setKeycloakId(keycloakId);
        Scout saved = scoutRepository.save(scout);

        log.info("Scout created successfully: {}", saved.getId());
        return scoutMapper.toResponse(saved);
    }

    @Override
    public ScoutResponse getScoutById(Long id) {
        log.debug("Fetching scout by ID: {}", id);
        Scout scout = scoutRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scout", "id", id));
        return scoutMapper.toResponse(scout);
    }

    @Override
    public List<ScoutResponse> getAllScouts() {
        log.debug("Fetching all scouts");
        List<Scout> scouts = scoutRepository.findAll();
        return scoutMapper.toResponseList(scouts);
    }

    @Override
    public ScoutResponse updateScout(Long id, ScoutUpdateRequest request) {
        log.debug("Updating scout with ID: {}", id);
        Scout scout = scoutRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scout", "id", id));

        scoutMapper.updateFromDto(request, scout);
        Scout updated = scoutRepository.save(scout);

        log.info("Scout updated successfully: {}", id);
        return scoutMapper.toResponse(updated);
    }

    private UserRequest buildKeycloakRequest(ScoutRequest request) {
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
        kr.setRole(Role.SCOUT);
        return kr;
    }
}