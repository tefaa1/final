package com.example.playerservice.service;

import com.example.playerservice.dto.request.PlayerCallUpRequestCreate;
import com.example.playerservice.dto.response.PlayerCallUpResponse;

import java.util.List;

public interface PlayerCallUpRequestService {
    PlayerCallUpResponse createCallUpRequest(PlayerCallUpRequestCreate request);
    PlayerCallUpResponse updateCallUpRequest(Long id, PlayerCallUpRequestCreate request);
    void deleteCallUpRequest(Long id);
    PlayerCallUpResponse getCallUpRequestById(Long id);
    List<PlayerCallUpResponse> getAllCallUpRequests();
}

