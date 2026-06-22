package com.example.notificationmessagingservice.mapper;

import com.example.notificationmessagingservice.dto.request.NotificationRequest;
import com.example.notificationmessagingservice.dto.response.NotificationResponse;
import com.example.notificationmessagingservice.model.entity.Notification;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
    NotificationResponse toResponse(Notification entity);
    Notification toEntity(NotificationRequest request);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(NotificationRequest request, @MappingTarget Notification entity);
}
