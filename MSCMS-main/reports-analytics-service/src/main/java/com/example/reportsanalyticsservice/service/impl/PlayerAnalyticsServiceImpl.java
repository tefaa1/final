package com.example.reportsanalyticsservice.service.impl;

import com.example.reportsanalyticsservice.dto.request.PlayerAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.PlayerAnalyticsResponse;
import com.example.reportsanalyticsservice.exception.custom.ResourceNotFoundException;
import com.example.reportsanalyticsservice.mapper.PlayerAnalyticsMapper;
import com.example.reportsanalyticsservice.model.entity.PlayerAnalytics;
import com.example.reportsanalyticsservice.model.enums.SportType;
import com.example.reportsanalyticsservice.repository.PlayerAnalyticsRepository;
import com.example.reportsanalyticsservice.service.PlayerAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlayerAnalyticsServiceImpl implements PlayerAnalyticsService {

    private final PlayerAnalyticsRepository repository;
    private final PlayerAnalyticsMapper mapper;

    @Override
    public PlayerAnalyticsResponse create(PlayerAnalyticsRequest request) {
        PlayerAnalytics entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public PlayerAnalyticsResponse update(Long id, PlayerAnalyticsRequest request) {
        PlayerAnalytics entity = findEntity(id);
        mapper.updateFromRequest(request, entity);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Long id) { repository.delete(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public PlayerAnalyticsResponse getById(Long id) { return mapper.toResponse(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerAnalyticsResponse> getAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerAnalyticsResponse> getBySportType(SportType sportType) {
        return repository.findBySportType(sportType).stream().map(mapper::toResponse).toList();
    }

    private PlayerAnalytics findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PlayerAnalytics not found with id " + id));
    }
}
