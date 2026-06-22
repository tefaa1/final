package com.example.reportsanalyticsservice.service.impl;

import com.example.reportsanalyticsservice.dto.request.MatchAnalysisRequest;
import com.example.reportsanalyticsservice.dto.response.MatchAnalysisResponse;
import com.example.reportsanalyticsservice.exception.custom.ResourceNotFoundException;
import com.example.reportsanalyticsservice.mapper.MatchAnalysisMapper;
import com.example.reportsanalyticsservice.model.entity.MatchAnalysis;
import com.example.reportsanalyticsservice.repository.MatchAnalysisRepository;
import com.example.reportsanalyticsservice.model.enums.SportType;
import com.example.reportsanalyticsservice.service.MatchAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MatchAnalysisServiceImpl implements MatchAnalysisService {

    private final MatchAnalysisRepository repository;
    private final MatchAnalysisMapper mapper;

    @Override
    public MatchAnalysisResponse create(MatchAnalysisRequest request) {
        MatchAnalysis entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public MatchAnalysisResponse update(Long id, MatchAnalysisRequest request) {
        MatchAnalysis entity = findEntity(id);
        mapper.updateFromRequest(request, entity);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        MatchAnalysis entity = findEntity(id);
        repository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public MatchAnalysisResponse getById(Long id) {
        return mapper.toResponse(findEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchAnalysisResponse> getAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchAnalysisResponse> getBySportType(SportType sportType) {
        return repository.findBySportType(sportType).stream().map(mapper::toResponse).toList();
    }

    private MatchAnalysis findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MatchAnalysis not found with id " + id));
    }
}
