package com.example.reportsanalyticsservice.service.impl;

import com.example.reportsanalyticsservice.dto.request.TrainingAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.TrainingAnalyticsResponse;
import com.example.reportsanalyticsservice.exception.custom.ResourceNotFoundException;
import com.example.reportsanalyticsservice.mapper.TrainingAnalyticsMapper;
import com.example.reportsanalyticsservice.model.entity.TrainingAnalytics;
import com.example.reportsanalyticsservice.repository.TrainingAnalyticsRepository;
import com.example.reportsanalyticsservice.service.TrainingAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TrainingAnalyticsServiceImpl implements TrainingAnalyticsService {

    private final TrainingAnalyticsRepository repository;
    private final TrainingAnalyticsMapper mapper;

    @Override
    public TrainingAnalyticsResponse create(TrainingAnalyticsRequest request) {
        TrainingAnalytics entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public TrainingAnalyticsResponse update(Long id, TrainingAnalyticsRequest request) {
        TrainingAnalytics entity = findEntity(id);
        mapper.updateFromRequest(request, entity);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Long id) { repository.delete(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public TrainingAnalyticsResponse getById(Long id) { return mapper.toResponse(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingAnalyticsResponse> getAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    private TrainingAnalytics findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingAnalytics not found with id " + id));
    }
}
