package com.example.usermanagementservice.service.player;

import com.example.usermanagementservice.dto.request.playerReq.PlayerRequest;
import com.example.usermanagementservice.dto.request.userReq.UserRequest;
import com.example.usermanagementservice.dto.response.playerRes.PlayerResponse;
import com.example.usermanagementservice.dto.update.playerUp.PlayerStatusUpdateRequest;
import com.example.usermanagementservice.dto.update.playerUp.PlayerUpdateRequest;
import com.example.usermanagementservice.exception.customException.DuplicateResourceException;
import com.example.usermanagementservice.exception.customException.InvalidOperationException;
import com.example.usermanagementservice.exception.customException.KeycloakException;
import com.example.usermanagementservice.exception.customException.ResourceNotFoundException;
import com.example.usermanagementservice.mapper.PlayerMapper;
import com.example.usermanagementservice.model.entity.Player;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.model.enums.StatusOfPlayer;
import com.example.usermanagementservice.repository.PlayerRepository;
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
public class PlayerServiceImpl implements PlayerService {

    private final PlayerRepository playerRepository;
    private final PlayerMapper playerMapper;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    public PlayerResponse createPlayer(PlayerRequest request) {
        log.debug("Creating player: {}", request.getUsername());

        // Check if email already exists
        if (playerRepository.findAll().stream()
                .anyMatch(p -> p.getEmail().equals(request.getEmail()))) {
            throw new DuplicateResourceException("Player", "email", request.getEmail());
        }

        // Check if kit number already exists
        if (request.getKitNumber() != null && playerRepository.existsByKitNumber(request.getKitNumber())) {
            throw new DuplicateResourceException("Player", "kitNumber", request.getKitNumber());
        }

        // Create user in Keycloak
        UserRequest keycloakRequest = buildKeycloakRequest(request);
        String keycloakId;
        try {
            String token = keycloakAdminService.getAdminAccessToken();
            keycloakId = keycloakAdminService.createUser(token, keycloakRequest);

            // Assign role
            keycloakAdminService.assignRealmRoleToUser(keycloakId, "PLAYER");
        } catch (KeycloakException e) {
            log.error("Failed to create user in Keycloak", e);
            throw new InvalidOperationException("Failed to create user in Keycloak: " + e.getMessage());
        }

        // Create in database
        Player player = playerMapper.toEntity(request);
        player.setKeycloakId(keycloakId);
        Player saved = playerRepository.save(player);

        log.info("Player created successfully: {}", saved.getId());
        return playerMapper.toResponse(saved);
    }

    @Override
    public PlayerResponse getPlayerById(Long id) {
        log.debug("Fetching player by ID: {}", id);
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", id));
        return playerMapper.toResponse(player);
    }

    @Override
    public List<PlayerResponse> getPlayersByStatus(StatusOfPlayer status) {
        log.debug("Fetching players by status: {}", status);
        List<Player> players = playerRepository.findByStatus(status);
        return playerMapper.toResponseList(players);
    }

    @Override
    public PlayerResponse updatePlayer(Long id, PlayerUpdateRequest request) {
        log.debug("Updating player with ID: {}", id);
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", id));

        // Check kit number uniqueness if being updated
        if (request.getKitNumber() != null &&
                !request.getKitNumber().equals(player.getKitNumber()) &&
                playerRepository.existsByKitNumber(request.getKitNumber())) {
            throw new DuplicateResourceException("Player", "kitNumber", request.getKitNumber());
        }

        playerMapper.updateFromDto(request, player);
        Player updated = playerRepository.save(player);

        log.info("Player updated successfully: {}", id);
        return playerMapper.toResponse(updated);
    }

    @Override
    public PlayerResponse updatePlayerStatus(Long id, PlayerStatusUpdateRequest request) {
        log.debug("Updating player status for ID: {}", id);
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", id));

        player.setStatus(request.getStatus());
        Player updated = playerRepository.save(player);

        log.info("Player status updated successfully: {}", id);
        return playerMapper.toResponse(updated);
    }

    @Override
    public PlayerResponse assignRoster(Long playerId, Long rosterId) {
        log.debug("Assigning roster {} to player {}", rosterId, playerId);
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", playerId));

        player.setRosterId(rosterId);
        Player updated = playerRepository.save(player);

        log.info("Roster assigned successfully to player");
        return playerMapper.toResponse(updated);
    }

    @Override
    public PlayerResponse assignContract(Long playerId, Long contractId) {
        log.debug("Assigning contract {} to player {}", contractId, playerId);
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", playerId));

        player.setContractId(contractId);
        Player updated = playerRepository.save(player);

        log.info("Contract assigned successfully to player");
        return playerMapper.toResponse(updated);
    }

    private UserRequest buildKeycloakRequest(PlayerRequest request) {
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
        keycloakRequest.setRole(Role.PLAYER);
        return keycloakRequest;
    }
}
