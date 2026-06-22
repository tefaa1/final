package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.dto.request.MatchFormationRequest;
import com.example.trainingmatchservice.dto.response.MatchFormationResponse;

import java.util.List;

public interface MatchFormationService {
    MatchFormationResponse createMatchFormation(MatchFormationRequest request);
    MatchFormationResponse updateMatchFormation(Long id, MatchFormationRequest request);
    void deleteMatchFormation(Long id);
    MatchFormationResponse getMatchFormationById(Long id);
    List<MatchFormationResponse> getAllMatchFormations();
}

