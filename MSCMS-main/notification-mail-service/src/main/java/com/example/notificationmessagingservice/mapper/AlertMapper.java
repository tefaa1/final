package com.example.notificationmessagingservice.mapper;

import com.example.notificationmessagingservice.dto.request.AlertRequest;
import com.example.notificationmessagingservice.dto.response.AlertResponse;
import com.example.notificationmessagingservice.model.entity.Alert;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface AlertMapper {
    AlertResponse toResponse(Alert entity);
    Alert toEntity(AlertRequest request);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(AlertRequest request, @MappingTarget Alert entity);
}
