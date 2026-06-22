package com.example.playerservice.service;

import com.example.playerservice.dto.request.PlayerTransferOutgoingRequest;
import com.example.playerservice.dto.response.PlayerTransferOutgoingResponse;

import java.util.List;

public interface PlayerTransferOutgoingService {
    PlayerTransferOutgoingResponse createOutgoingTransfer(PlayerTransferOutgoingRequest request);
    PlayerTransferOutgoingResponse updateOutgoingTransfer(Long id, PlayerTransferOutgoingRequest request);
    void deleteOutgoingTransfer(Long id);
    PlayerTransferOutgoingResponse getOutgoingTransferById(Long id);
    List<PlayerTransferOutgoingResponse> getAllOutgoingTransfers();
}

