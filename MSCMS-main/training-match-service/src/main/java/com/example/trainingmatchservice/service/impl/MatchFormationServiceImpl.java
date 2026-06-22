package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.MatchFormationRequest;
import com.example.trainingmatchservice.dto.response.MatchFormationResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.MatchFormationMapper;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.MatchFormation;
import com.example.trainingmatchservice.repository.MatchFormationRepository;
import com.example.trainingmatchservice.repository.MatchRepository;
import com.example.trainingmatchservice.service.MatchFormationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MatchFormationServiceImpl implements MatchFormationService {

    private final MatchFormationRepository matchFormationRepository;
    private final MatchFormationMapper matchFormationMapper;
    private final MatchRepository matchRepository;

    @Override
    public MatchFormationResponse createMatchFormation(MatchFormationRequest request) {
        MatchFormation formation = matchFormationMapper.toEntity(request);
        return matchFormationMapper.toResponse(matchFormationRepository.save(formation));
    }

    @Override
    public MatchFormationResponse updateMatchFormation(Long id, MatchFormationRequest request) {
        MatchFormation formation = getMatchFormation(id);
        matchFormationMapper.updateFromRequest(request, formation);
        return matchFormationMapper.toResponse(matchFormationRepository.save(formation));
    }

    @Override
    public void deleteMatchFormation(Long id) {
        MatchFormation formation = getMatchFormation(id);
        for (Match match : formation.getMatches()) {
            match.setMatchFormation(null);
        }
        matchRepository.saveAll(formation.getMatches());
        matchFormationRepository.delete(formation);
    }

    @Override
    @Transactional(readOnly = true)
    public MatchFormationResponse getMatchFormationById(Long id) {
        return matchFormationMapper.toResponse(getMatchFormation(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchFormationResponse> getAllMatchFormations() {
        return matchFormationRepository.findAll()
                .stream()
                .map(matchFormationMapper::toResponse)
                .toList();
    }

    private MatchFormation getMatchFormation(Long id) {
        return matchFormationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match formation not found with id " + id));
    }
}

