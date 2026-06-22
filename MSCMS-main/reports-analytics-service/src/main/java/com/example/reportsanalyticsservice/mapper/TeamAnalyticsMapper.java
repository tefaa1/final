package com.example.reportsanalyticsservice.mapper;

import com.example.reportsanalyticsservice.dto.request.TeamAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.TeamAnalyticsResponse;
import com.example.reportsanalyticsservice.model.entity.TeamAnalytics;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TeamAnalyticsMapper {
    TeamAnalyticsResponse toResponse(TeamAnalytics entity);
    TeamAnalytics toEntity(TeamAnalyticsRequest request);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(TeamAnalyticsRequest request, @MappingTarget TeamAnalytics entity);
}
