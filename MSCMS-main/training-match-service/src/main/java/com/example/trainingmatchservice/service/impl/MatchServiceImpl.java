package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.MatchRequest;
import com.example.trainingmatchservice.dto.response.MatchResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.MatchMapper;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.MatchFormation;
import com.example.trainingmatchservice.repository.MatchFormationRepository;
import com.example.trainingmatchservice.repository.MatchRepository;
import com.example.trainingmatchservice.model.match.enums.SportType;
import com.example.trainingmatchservice.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MatchServiceImpl implements MatchService {

    private final MatchRepository matchRepository;
    private final MatchFormationRepository matchFormationRepository;
    private final MatchMapper matchMapper;

    @Override
    public MatchResponse createMatch(MatchRequest request) {
        Match match = matchMapper.toEntity(request);
        if (request.matchFormationId() != null) {
            match.setMatchFormation(getMatchFormation(request.matchFormationId()));
        }
        return matchMapper.toResponse(matchRepository.save(match));
    }

    @Override
    public MatchResponse updateMatch(Long id, MatchRequest request) {
        Match match = getMatch(id);
        if (request.matchFormationId() != null) {
            match.setMatchFormation(getMatchFormation(request.matchFormationId()));
        }
        matchMapper.updateFromRequest(request, match);
        return matchMapper.toResponse(matchRepository.save(match));
    }

    @Override
    public void deleteMatch(Long id) {
        Match match = getMatch(id);
        matchRepository.delete(match);
    }

    @Override
    @Transactional(readOnly = true)
    public MatchResponse getMatchById(Long id) {
        return matchMapper.toResponse(getMatch(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchResponse> getAllMatches() {
        return matchRepository.findAll()
                .stream()
                .map(matchMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchResponse> getMatchesBySportType(SportType sportType) {
        return matchRepository.findBySportType(sportType)
                .stream()
                .map(matchMapper::toResponse)
                .toList();
    }

    private Match getMatch(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id " + id));
    }

    private MatchFormation getMatchFormation(Long id) {
        return matchFormationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match formation not found with id " + id));
    }
}

