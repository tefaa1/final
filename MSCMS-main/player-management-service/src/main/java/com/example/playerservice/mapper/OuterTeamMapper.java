package com.example.playerservice.mapper;

import com.example.playerservice.dto.request.OuterTeamRequest;
import com.example.playerservice.dto.response.OuterTeamResponse;
import com.example.playerservice.model.entity.OuterTeam;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface OuterTeamMapper {

    OuterTeamResponse toResponse(OuterTeam entity);

    OuterTeam toEntity(OuterTeamRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(OuterTeamRequest request, @MappingTarget OuterTeam entity);
}

