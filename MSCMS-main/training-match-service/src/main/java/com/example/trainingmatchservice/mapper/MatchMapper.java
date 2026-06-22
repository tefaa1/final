package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.MatchRequest;
import com.example.trainingmatchservice.dto.response.MatchResponse;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.MatchFormation;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface MatchMapper {

    @Mapping(target = "matchFormationId", source = "matchFormation.id")
    MatchResponse toResponse(Match entity);

    @Mapping(target = "matchFormation", source = "matchFormationId")
    Match toEntity(MatchRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(MatchRequest request, @MappingTarget Match entity);

    default MatchFormation mapMatchFormation(Long id) {
        if (id == null) return null;
        MatchFormation formation = new MatchFormation();
        formation.setId(id);
        return formation;
    }
}

