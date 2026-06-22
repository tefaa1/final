package com.example.playerservice.service;

import com.example.playerservice.dto.request.OuterTeamRequest;
import com.example.playerservice.dto.response.OuterTeamResponse;

import java.util.List;

public interface OuterTeamService {
    OuterTeamResponse createOuterTeam(OuterTeamRequest request);
    OuterTeamResponse updateOuterTeam(Long id, OuterTeamRequest request);
    void deleteOuterTeam(Long id);
    OuterTeamResponse getOuterTeamById(Long id);
    List<OuterTeamResponse> getAllOuterTeams();
}

