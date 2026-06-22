package com.example.playerservice.mapper;

import com.example.playerservice.dto.request.SportRequest;
import com.example.playerservice.dto.response.SportResponse;
import com.example.playerservice.model.entity.Sport;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface SportMapper {

    SportResponse toResponse(Sport entity);

    Sport toEntity(SportRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(SportRequest request, @MappingTarget Sport entity);
}

