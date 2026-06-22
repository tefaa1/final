package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.MatchFormationRequest;
import com.example.trainingmatchservice.dto.response.MatchFormationResponse;
import com.example.trainingmatchservice.model.match.entity.MatchFormation;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface MatchFormationMapper {

    MatchFormationResponse toResponse(MatchFormation entity);

    MatchFormation toEntity(MatchFormationRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(MatchFormationRequest request, @MappingTarget MatchFormation entity);
}

