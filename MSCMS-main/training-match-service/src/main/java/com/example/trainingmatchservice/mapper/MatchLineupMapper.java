package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.MatchLineupRequest;
import com.example.trainingmatchservice.dto.response.MatchLineupResponse;
import com.example.trainingmatchservice.model.match.entity.MatchFormation;
import com.example.trainingmatchservice.model.match.entity.MatchLineup;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface MatchLineupMapper {

    @Mapping(target = "matchFormationId", source = "matchFormation.id")
    MatchLineupResponse toResponse(MatchLineup entity);

    @Mapping(target = "matchFormation", source = "matchFormationId")
    MatchLineup toEntity(MatchLineupRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(MatchLineupRequest request, @MappingTarget MatchLineup entity);

    default MatchFormation mapMatchFormation(Long id) {
        if (id == null) return null;
        MatchFormation formation = new MatchFormation();
        formation.setId(id);
        return formation;
    }
}

