package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.MatchEventRequest;
import com.example.trainingmatchservice.dto.response.MatchEventResponse;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.MatchEvent;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface MatchEventMapper {

    @Mapping(target = "matchId", source = "match.id")
    MatchEventResponse toResponse(MatchEvent entity);

    @Mapping(target = "match", source = "matchId")
    MatchEvent toEntity(MatchEventRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(MatchEventRequest request, @MappingTarget MatchEvent entity);

    default Match mapMatch(Long id) {
        if (id == null) return null;
        Match match = new Match();
        match.setId(id);
        return match;
    }
}

