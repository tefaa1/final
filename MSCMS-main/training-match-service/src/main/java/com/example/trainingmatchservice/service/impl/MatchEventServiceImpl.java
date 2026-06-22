package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.MatchEventRequest;
import com.example.trainingmatchservice.dto.response.MatchEventResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.MatchEventMapper;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.MatchEvent;
import com.example.trainingmatchservice.repository.MatchEventRepository;
import com.example.trainingmatchservice.repository.MatchRepository;
import com.example.trainingmatchservice.service.MatchEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MatchEventServiceImpl implements MatchEventService {

    private final MatchEventRepository matchEventRepository;
    private final MatchRepository matchRepository;
    private final MatchEventMapper matchEventMapper;

    @Override
    public MatchEventResponse createMatchEvent(MatchEventRequest request) {
        MatchEvent event = matchEventMapper.toEntity(request);
        event.setMatch(getMatch(request.matchId()));
        return matchEventMapper.toResponse(matchEventRepository.save(event));
    }

    @Override
    public MatchEventResponse updateMatchEvent(Long id, MatchEventRequest request) {
        MatchEvent event = getMatchEvent(id);
        if (request.matchId() != null) {
            event.setMatch(getMatch(request.matchId()));
        }
        matchEventMapper.updateFromRequest(request, event);
        return matchEventMapper.toResponse(matchEventRepository.save(event));
    }

    @Override
    public void deleteMatchEvent(Long id) {
        MatchEvent event = getMatchEvent(id);
        matchEventRepository.delete(event);
    }

    @Override
    @Transactional(readOnly = true)
    public MatchEventResponse getMatchEventById(Long id) {
        return matchEventMapper.toResponse(getMatchEvent(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchEventResponse> getAllMatchEvents() {
        return matchEventRepository.findAll()
                .stream()
                .map(matchEventMapper::toResponse)
                .toList();
    }

    private MatchEvent getMatchEvent(Long id) {
        return matchEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match event not found with id " + id));
    }

    private Match getMatch(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id " + id));
    }
}

