package com.example.reportsanalyticsservice.service.impl;

import com.example.reportsanalyticsservice.dto.request.ScoutReportRequest;
import com.example.reportsanalyticsservice.dto.response.ScoutReportResponse;
import com.example.reportsanalyticsservice.exception.custom.ResourceNotFoundException;
import com.example.reportsanalyticsservice.mapper.ScoutReportMapper;
import com.example.reportsanalyticsservice.model.entity.ScoutReport;
import com.example.reportsanalyticsservice.repository.ScoutReportRepository;
import com.example.reportsanalyticsservice.service.ScoutReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ScoutReportServiceImpl implements ScoutReportService {

    private final ScoutReportRepository repository;
    private final ScoutReportMapper mapper;

    @Override
    public ScoutReportResponse create(ScoutReportRequest request) {
        ScoutReport entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public ScoutReportResponse update(Long id, ScoutReportRequest request) {
        ScoutReport entity = findEntity(id);
        mapper.updateFromRequest(request, entity);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Long id) { repository.delete(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public ScoutReportResponse getById(Long id) { return mapper.toResponse(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public List<ScoutReportResponse> getAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    private ScoutReport findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ScoutReport not found with id " + id));
    }
}
