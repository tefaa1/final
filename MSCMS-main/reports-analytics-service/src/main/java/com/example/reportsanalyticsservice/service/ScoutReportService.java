package com.example.reportsanalyticsservice.service;

import com.example.reportsanalyticsservice.dto.request.ScoutReportRequest;
import com.example.reportsanalyticsservice.dto.response.ScoutReportResponse;
import java.util.List;

public interface ScoutReportService {
    ScoutReportResponse create(ScoutReportRequest request);
    ScoutReportResponse update(Long id, ScoutReportRequest request);
    void delete(Long id);
    ScoutReportResponse getById(Long id);
    List<ScoutReportResponse> getAll();
}
