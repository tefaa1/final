package com.example.playerservice.service;

import com.example.playerservice.dto.request.PlayerContractRequest;
import com.example.playerservice.dto.response.PlayerContractResponse;

import java.util.List;

public interface PlayerContractService {
    PlayerContractResponse createPlayerContract(PlayerContractRequest request);
    PlayerContractResponse updatePlayerContract(Long id, PlayerContractRequest request);
    void deletePlayerContract(Long id);
    PlayerContractResponse getPlayerContractById(Long id);
    List<PlayerContractResponse> getAllPlayerContracts();
}

