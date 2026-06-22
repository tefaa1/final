package com.example.playerservice.service;

import com.example.playerservice.dto.request.PlayerTransferIncomingRequest;
import com.example.playerservice.dto.response.PlayerTransferIncomingResponse;

import java.util.List;

public interface PlayerTransferIncomingService {
    PlayerTransferIncomingResponse createIncomingTransfer(PlayerTransferIncomingRequest request);
    PlayerTransferIncomingResponse updateIncomingTransfer(Long id, PlayerTransferIncomingRequest request);
    void deleteIncomingTransfer(Long id);
    PlayerTransferIncomingResponse getIncomingTransferById(Long id);
    List<PlayerTransferIncomingResponse> getAllIncomingTransfers();
}

