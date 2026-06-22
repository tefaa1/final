package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.dto.request.MatchEventRequest;
import com.example.trainingmatchservice.dto.response.MatchEventResponse;

import java.util.List;

public interface MatchEventService {
    MatchEventResponse createMatchEvent(MatchEventRequest request);
    MatchEventResponse updateMatchEvent(Long id, MatchEventRequest request);
    void deleteMatchEvent(Long id);
    MatchEventResponse getMatchEventById(Long id);
    List<MatchEventResponse> getAllMatchEvents();
}

