package com.example.reportsanalyticsservice.service;

import com.example.reportsanalyticsservice.dto.request.PlayerAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.PlayerAnalyticsResponse;
import com.example.reportsanalyticsservice.model.enums.SportType;
import java.util.List;

public interface PlayerAnalyticsService {
    PlayerAnalyticsResponse create(PlayerAnalyticsRequest request);
    PlayerAnalyticsResponse update(Long id, PlayerAnalyticsRequest request);
    void delete(Long id);
    PlayerAnalyticsResponse getById(Long id);
    List<PlayerAnalyticsResponse> getAll();
    List<PlayerAnalyticsResponse> getBySportType(SportType sportType);
}
