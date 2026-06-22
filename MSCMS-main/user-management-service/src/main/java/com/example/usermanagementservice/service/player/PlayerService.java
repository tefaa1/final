package com.example.usermanagementservice.service.player;


import com.example.usermanagementservice.dto.request.playerReq.PlayerRequest;
import com.example.usermanagementservice.dto.response.playerRes.PlayerResponse;
import com.example.usermanagementservice.dto.update.playerUp.PlayerStatusUpdateRequest;
import com.example.usermanagementservice.dto.update.playerUp.PlayerUpdateRequest;
import com.example.usermanagementservice.model.enums.StatusOfPlayer;

import java.util.List;

public interface PlayerService {
    PlayerResponse createPlayer(PlayerRequest request);
    PlayerResponse getPlayerById(Long id);
    List<PlayerResponse> getPlayersByStatus(StatusOfPlayer status);
    PlayerResponse updatePlayer(Long id, PlayerUpdateRequest request);
    PlayerResponse updatePlayerStatus(Long id, PlayerStatusUpdateRequest request);
    PlayerResponse assignRoster(Long playerId, Long rosterId);
    PlayerResponse assignContract(Long playerId, Long contractId);
}