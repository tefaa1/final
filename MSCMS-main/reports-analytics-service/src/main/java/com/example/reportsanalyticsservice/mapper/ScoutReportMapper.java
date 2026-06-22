package com.example.reportsanalyticsservice.mapper;

import com.example.reportsanalyticsservice.dto.request.ScoutReportRequest;
import com.example.reportsanalyticsservice.dto.response.ScoutReportResponse;
import com.example.reportsanalyticsservice.model.entity.ScoutReport;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface ScoutReportMapper {
    ScoutReportResponse toResponse(ScoutReport entity);
    ScoutReport toEntity(ScoutReportRequest request);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(ScoutReportRequest request, @MappingTarget ScoutReport entity);
}
