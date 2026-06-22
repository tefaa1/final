package com.example.reportsanalyticsservice.mapper;

import com.example.reportsanalyticsservice.dto.request.MatchAnalysisRequest;
import com.example.reportsanalyticsservice.dto.response.MatchAnalysisResponse;
import com.example.reportsanalyticsservice.model.entity.MatchAnalysis;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface MatchAnalysisMapper {
    MatchAnalysisResponse toResponse(MatchAnalysis entity);
    MatchAnalysis toEntity(MatchAnalysisRequest request);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(MatchAnalysisRequest request, @MappingTarget MatchAnalysis entity);
}
