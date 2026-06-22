package com.example.playerservice.service.impl;

import com.example.playerservice.dto.request.RosterRequest;
import com.example.playerservice.dto.response.RosterResponse;
import com.example.playerservice.exception.custom.ResourceNotFoundException;
import com.example.playerservice.mapper.RosterMapper;
import com.example.playerservice.model.entity.Roster;
import com.example.playerservice.model.entity.Team;
import com.example.playerservice.repository.RosterRepository;
import com.example.playerservice.repository.TeamRepository;
import com.example.playerservice.service.RosterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RosterServiceImpl implements RosterService {

    private final RosterRepository rosterRepository;
    private final TeamRepository teamRepository;
    private final RosterMapper rosterMapper;

    @Override
    public RosterResponse createRoster(RosterRequest request) {
        Team team = getTeam(request.teamId());
        Roster roster = rosterMapper.toEntity(request);
        roster.setTeam(team);
        return rosterMapper.toResponse(rosterRepository.save(roster));
    }

    @Override
    public RosterResponse updateRoster(Long id, RosterRequest request) {
        Roster roster = getRoster(id);
        if (request.teamId() != null) {
            roster.setTeam(getTeam(request.teamId()));
        }
        rosterMapper.updateFromRequest(request, roster);
        return rosterMapper.toResponse(rosterRepository.save(roster));
    }

    @Override
    public void deleteRoster(Long id) {
        Roster roster = getRoster(id);
        rosterRepository.delete(roster);
    }

    @Override
    @Transactional(readOnly = true)
    public RosterResponse getRosterById(Long id) {
        return rosterMapper.toResponse(getRoster(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RosterResponse> getAllRosters() {
        return rosterRepository.findAll()
                .stream()
                .map(rosterMapper::toResponse)
                .toList();
    }

    private Roster getRoster(Long id) {
        return rosterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Roster not found with id " + id));
    }

    private Team getTeam(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id " + id));
    }
}

