package com.example.reportsanalyticsservice.mapper;

import com.example.reportsanalyticsservice.dto.request.PlayerAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.PlayerAnalyticsResponse;
import com.example.reportsanalyticsservice.model.entity.PlayerAnalytics;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface PlayerAnalyticsMapper {
    PlayerAnalyticsResponse toResponse(PlayerAnalytics entity);
    PlayerAnalytics toEntity(PlayerAnalyticsRequest request);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(PlayerAnalyticsRequest request, @MappingTarget PlayerAnalytics entity);
}
