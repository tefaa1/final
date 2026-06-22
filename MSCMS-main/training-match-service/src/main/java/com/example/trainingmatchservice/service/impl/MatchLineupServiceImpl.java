package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.MatchLineupRequest;
import com.example.trainingmatchservice.dto.response.MatchLineupResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.MatchLineupMapper;
import com.example.trainingmatchservice.model.match.entity.MatchFormation;
import com.example.trainingmatchservice.model.match.entity.MatchLineup;
import com.example.trainingmatchservice.repository.MatchFormationRepository;
import com.example.trainingmatchservice.repository.MatchLineupRepository;
import com.example.trainingmatchservice.service.MatchLineupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MatchLineupServiceImpl implements MatchLineupService {

    private final MatchLineupRepository matchLineupRepository;
    private final MatchFormationRepository matchFormationRepository;
    private final MatchLineupMapper matchLineupMapper;

    @Override
    public MatchLineupResponse createMatchLineup(MatchLineupRequest request) {
        MatchLineup lineup = matchLineupMapper.toEntity(request);
        lineup.setMatchFormation(getMatchFormation(request.matchFormationId()));
        return matchLineupMapper.toResponse(matchLineupRepository.save(lineup));
    }

    @Override
    public MatchLineupResponse updateMatchLineup(Long id, MatchLineupRequest request) {
        MatchLineup lineup = getMatchLineup(id);
        if (request.matchFormationId() != null) {
            lineup.setMatchFormation(getMatchFormation(request.matchFormationId()));
        }
        matchLineupMapper.updateFromRequest(request, lineup);
        return matchLineupMapper.toResponse(matchLineupRepository.save(lineup));
    }

    @Override
    public void deleteMatchLineup(Long id) {
        MatchLineup lineup = getMatchLineup(id);
        matchLineupRepository.delete(lineup);
    }

    @Override
    @Transactional(readOnly = true)
    public MatchLineupResponse getMatchLineupById(Long id) {
        return matchLineupMapper.toResponse(getMatchLineup(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchLineupResponse> getAllMatchLineups() {
        return matchLineupRepository.findAll()
                .stream()
                .map(matchLineupMapper::toResponse)
                .toList();
    }

    private MatchLineup getMatchLineup(Long id) {
        return matchLineupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match lineup not found with id " + id));
    }

    private MatchFormation getMatchFormation(Long id) {
        return matchFormationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match formation not found with id " + id));
    }
}

