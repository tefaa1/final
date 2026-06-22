package com.example.usermanagementservice.service.fanService;

import com.example.usermanagementservice.dto.request.fanReq.FanRequest;
import com.example.usermanagementservice.dto.request.userReq.UserRequest;
import com.example.usermanagementservice.dto.response.fanRes.FanResponse;
import com.example.usermanagementservice.dto.update.fanUp.FanUpdateRequest;
import com.example.usermanagementservice.exception.customException.InvalidOperationException;
import com.example.usermanagementservice.exception.customException.KeycloakException;
import com.example.usermanagementservice.exception.customException.ResourceNotFoundException;
import com.example.usermanagementservice.mapper.FanMapper;
import com.example.usermanagementservice.model.entity.Fan;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.repository.FanRepository;
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
public class FanServiceImpl implements FanService {

    private final FanRepository fanRepository;
    private final FanMapper fanMapper;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    public FanResponse createFan(FanRequest request) {
        log.debug("Creating fan: {}", request.getUsername());

        UserRequest kr = buildKeycloakRequest(request);
        String keycloakId;
        try {
            String token = keycloakAdminService.getAdminAccessToken();
            keycloakId = keycloakAdminService.createUser(token, kr);
            keycloakAdminService.assignRealmRoleToUser(keycloakId, "FAN");
        } catch (KeycloakException e) {
            throw new InvalidOperationException("Failed to create fan in Keycloak: " + e.getMessage());
        }

        Fan fan = fanMapper.toEntity(request);
        fan.setKeycloakId(keycloakId);
        Fan saved = fanRepository.save(fan);

        log.info("Fan created successfully: {}", saved.getId());
        return fanMapper.toResponse(saved);
    }

    @Override
    public FanResponse getFanById(Long id) {
        log.debug("Fetching fan by ID: {}", id);
        Fan fan = fanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fan", "id", id));
        return fanMapper.toResponse(fan);
    }

    @Override
    public List<FanResponse> getAllFans() {
        log.debug("Fetching all fans");
        List<Fan> fans = fanRepository.findAll();
        return fanMapper.toResponseList(fans);
    }

    @Override
    public FanResponse updateFan(Long id, FanUpdateRequest request) {
        log.debug("Updating fan with ID: {}", id);
        Fan fan = fanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fan", "id", id));

        fanMapper.updateFromDto(request, fan);
        Fan updated = fanRepository.save(fan);

        log.info("Fan updated successfully: {}", id);
        return fanMapper.toResponse(updated);
    }

    private UserRequest buildKeycloakRequest(FanRequest request) {
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
        kr.setRole(Role.FAN);
        return kr;
    }
}