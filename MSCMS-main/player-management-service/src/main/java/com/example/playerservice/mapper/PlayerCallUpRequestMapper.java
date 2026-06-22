package com.example.playerservice.mapper;

import com.example.playerservice.dto.request.PlayerCallUpRequestCreate;
import com.example.playerservice.dto.response.PlayerCallUpResponse;
import com.example.playerservice.model.entity.PlayerCallUpRequest;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface PlayerCallUpRequestMapper {

    PlayerCallUpResponse toResponse(PlayerCallUpRequest entity);

    PlayerCallUpRequest toEntity(PlayerCallUpRequestCreate request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(PlayerCallUpRequestCreate request, @MappingTarget PlayerCallUpRequest entity);
}

