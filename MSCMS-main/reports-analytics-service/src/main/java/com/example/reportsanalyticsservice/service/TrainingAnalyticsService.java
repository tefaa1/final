package com.example.reportsanalyticsservice.service;

import com.example.reportsanalyticsservice.dto.request.TrainingAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.TrainingAnalyticsResponse;
import java.util.List;

public interface TrainingAnalyticsService {
    TrainingAnalyticsResponse create(TrainingAnalyticsRequest request);
    TrainingAnalyticsResponse update(Long id, TrainingAnalyticsRequest request);
    void delete(Long id);
    TrainingAnalyticsResponse getById(Long id);
    List<TrainingAnalyticsResponse> getAll();
}
