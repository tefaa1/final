package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.PlayerMatchStatisticsRequest;
import com.example.trainingmatchservice.dto.response.PlayerMatchStatisticsResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.PlayerMatchStatisticsMapper;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.PlayerMatchStatistics;
import com.example.trainingmatchservice.repository.MatchRepository;
import com.example.trainingmatchservice.repository.PlayerMatchStatisticsRepository;
import com.example.trainingmatchservice.model.match.enums.SportType;
import com.example.trainingmatchservice.service.PlayerMatchStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlayerMatchStatisticsServiceImpl implements PlayerMatchStatisticsService {

    private final PlayerMatchStatisticsRepository playerMatchStatisticsRepository;
    private final MatchRepository matchRepository;
    private final PlayerMatchStatisticsMapper playerMatchStatisticsMapper;

    @Override
    public PlayerMatchStatisticsResponse createPlayerMatchStatistics(PlayerMatchStatisticsRequest request) {
        PlayerMatchStatistics stats = playerMatchStatisticsMapper.toEntity(request);
        stats.setMatch(getMatch(request.matchId()));
        return playerMatchStatisticsMapper.toResponse(playerMatchStatisticsRepository.save(stats));
    }

    @Override
    public PlayerMatchStatisticsResponse updatePlayerMatchStatistics(Long id, PlayerMatchStatisticsRequest request) {
        PlayerMatchStatistics stats = getStats(id);
        if (request.matchId() != null) {
            stats.setMatch(getMatch(request.matchId()));
        }
        playerMatchStatisticsMapper.updateFromRequest(request, stats);
        return playerMatchStatisticsMapper.toResponse(playerMatchStatisticsRepository.save(stats));
    }

    @Override
    public void deletePlayerMatchStatistics(Long id) {
        PlayerMatchStatistics stats = getStats(id);
        playerMatchStatisticsRepository.delete(stats);
    }

    @Override
    @Transactional(readOnly = true)
    public PlayerMatchStatisticsResponse getPlayerMatchStatisticsById(Long id) {
        return playerMatchStatisticsMapper.toResponse(getStats(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerMatchStatisticsResponse> getAllPlayerMatchStatistics() {
        return playerMatchStatisticsRepository.findAll()
                .stream()
                .map(playerMatchStatisticsMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerMatchStatisticsResponse> getStatsByMatch(Long matchId) {
        return playerMatchStatisticsRepository.findByMatchId(matchId)
                .stream()
                .map(playerMatchStatisticsMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerMatchStatisticsResponse> getStatsBySportType(SportType sportType) {
        return playerMatchStatisticsRepository.findBySportType(sportType)
                .stream()
                .map(playerMatchStatisticsMapper::toResponse)
                .toList();
    }

    private PlayerMatchStatistics getStats(Long id) {
        return playerMatchStatisticsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player match statistics not found with id " + id));
    }

    private Match getMatch(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id " + id));
    }
}

