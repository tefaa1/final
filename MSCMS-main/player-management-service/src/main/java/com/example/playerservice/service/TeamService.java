package com.example.playerservice.service;

import com.example.playerservice.dto.request.TeamRequest;
import com.example.playerservice.dto.response.TeamResponse;

import java.util.List;

public interface TeamService {
    TeamResponse createTeam(TeamRequest request);
    TeamResponse updateTeam(Long id, TeamRequest request);
    void deleteTeam(Long id);
    TeamResponse getTeamById(Long id);
    List<TeamResponse> getAllTeams();
}

