package com.example.playerservice.service.impl;

import com.example.playerservice.dto.request.TeamRequest;
import com.example.playerservice.dto.response.TeamResponse;
import com.example.playerservice.exception.custom.ResourceNotFoundException;
import com.example.playerservice.mapper.TeamMapper;
import com.example.playerservice.model.entity.Sport;
import com.example.playerservice.model.entity.Team;
import com.example.playerservice.repository.SportRepository;
import com.example.playerservice.repository.TeamRepository;
import com.example.playerservice.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final SportRepository sportRepository;
    private final TeamMapper teamMapper;

    @Override
    public TeamResponse createTeam(TeamRequest request) {
        Sport sport = getSport(request.sportId());
        Team team = teamMapper.toEntity(request);
        team.setSport(sport);
        return teamMapper.toResponse(teamRepository.save(team));
    }

    @Override
    public TeamResponse updateTeam(Long id, TeamRequest request) {
        Team team = getTeam(id);
        if (request.sportId() != null) {
            team.setSport(getSport(request.sportId()));
        }
        teamMapper.updateFromRequest(request, team);
        return teamMapper.toResponse(teamRepository.save(team));
    }

    @Override
    public void deleteTeam(Long id) {
        Team team = getTeam(id);
        teamRepository.delete(team);
    }

    @Override
    @Transactional(readOnly = true)
    public TeamResponse getTeamById(Long id) {
        return teamMapper.toResponse(getTeam(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamResponse> getAllTeams() {
        return teamRepository.findAll()
                .stream()
                .map(teamMapper::toResponse)
                .toList();
    }

    private Team getTeam(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id " + id));
    }

    private Sport getSport(Long id) {
        return sportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sport not found with id " + id));
    }
}

