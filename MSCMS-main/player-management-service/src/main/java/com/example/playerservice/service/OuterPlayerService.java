package com.example.playerservice.service;

import com.example.playerservice.dto.request.OuterPlayerRequest;
import com.example.playerservice.dto.response.OuterPlayerResponse;

import java.util.List;

public interface OuterPlayerService {
    OuterPlayerResponse createOuterPlayer(OuterPlayerRequest request);
    OuterPlayerResponse updateOuterPlayer(Long id, OuterPlayerRequest request);
    void deleteOuterPlayer(Long id);
    OuterPlayerResponse getOuterPlayerById(Long id);
    List<OuterPlayerResponse> getAllOuterPlayers();
}

