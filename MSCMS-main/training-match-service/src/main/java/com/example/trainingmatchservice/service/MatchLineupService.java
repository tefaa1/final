package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.dto.request.MatchLineupRequest;
import com.example.trainingmatchservice.dto.response.MatchLineupResponse;

import java.util.List;

public interface MatchLineupService {
    MatchLineupResponse createMatchLineup(MatchLineupRequest request);
    MatchLineupResponse updateMatchLineup(Long id, MatchLineupRequest request);
    void deleteMatchLineup(Long id);
    MatchLineupResponse getMatchLineupById(Long id);
    List<MatchLineupResponse> getAllMatchLineups();
}

