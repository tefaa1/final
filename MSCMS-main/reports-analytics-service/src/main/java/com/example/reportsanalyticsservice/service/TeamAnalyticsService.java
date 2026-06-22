package com.example.reportsanalyticsservice.service;

import com.example.reportsanalyticsservice.dto.request.TeamAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.TeamAnalyticsResponse;
import com.example.reportsanalyticsservice.model.enums.SportType;
import java.util.List;

public interface TeamAnalyticsService {
    TeamAnalyticsResponse create(TeamAnalyticsRequest request);
    TeamAnalyticsResponse update(Long id, TeamAnalyticsRequest request);
    void delete(Long id);
    TeamAnalyticsResponse getById(Long id);
    List<TeamAnalyticsResponse> getAll();
    List<TeamAnalyticsResponse> getBySportType(SportType sportType);
}
