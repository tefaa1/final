package com.example.notificationmessagingservice.mapper;

import com.example.notificationmessagingservice.dto.request.MessageRequest;
import com.example.notificationmessagingservice.dto.response.MessageResponse;
import com.example.notificationmessagingservice.model.entity.Message;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface MessageMapper {
    @Mapping(source = "parentMessage.id", target = "parentMessageId")
    MessageResponse toResponse(Message entity);

    @Mapping(target = "parentMessage", ignore = true)
    @Mapping(target = "replies", ignore = true)
    Message toEntity(MessageRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "parentMessage", ignore = true)
    @Mapping(target = "replies", ignore = true)
    void updateFromRequest(MessageRequest request, @MappingTarget Message entity);
}
