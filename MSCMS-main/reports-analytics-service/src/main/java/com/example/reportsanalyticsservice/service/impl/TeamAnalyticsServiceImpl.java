package com.example.reportsanalyticsservice.service.impl;

import com.example.reportsanalyticsservice.dto.request.TeamAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.TeamAnalyticsResponse;
import com.example.reportsanalyticsservice.exception.custom.ResourceNotFoundException;
import com.example.reportsanalyticsservice.mapper.TeamAnalyticsMapper;
import com.example.reportsanalyticsservice.model.entity.TeamAnalytics;
import com.example.reportsanalyticsservice.model.enums.SportType;
import com.example.reportsanalyticsservice.repository.TeamAnalyticsRepository;
import com.example.reportsanalyticsservice.service.TeamAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamAnalyticsServiceImpl implements TeamAnalyticsService {

    private final TeamAnalyticsRepository repository;
    private final TeamAnalyticsMapper mapper;

    @Override
    public TeamAnalyticsResponse create(TeamAnalyticsRequest request) {
        TeamAnalytics entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public TeamAnalyticsResponse update(Long id, TeamAnalyticsRequest request) {
        TeamAnalytics entity = findEntity(id);
        mapper.updateFromRequest(request, entity);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Long id) { repository.delete(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public TeamAnalyticsResponse getById(Long id) { return mapper.toResponse(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public List<TeamAnalyticsResponse> getAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamAnalyticsResponse> getBySportType(SportType sportType) {
        return repository.findBySportType(sportType).stream().map(mapper::toResponse).toList();
    }

    private TeamAnalytics findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TeamAnalytics not found with id " + id));
    }
}
