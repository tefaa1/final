package com.example.reportsanalyticsservice.mapper;

import com.example.reportsanalyticsservice.dto.request.TrainingAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.TrainingAnalyticsResponse;
import com.example.reportsanalyticsservice.model.entity.TrainingAnalytics;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TrainingAnalyticsMapper {
    TrainingAnalyticsResponse toResponse(TrainingAnalytics entity);
    TrainingAnalytics toEntity(TrainingAnalyticsRequest request);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(TrainingAnalyticsRequest request, @MappingTarget TrainingAnalytics entity);
}
