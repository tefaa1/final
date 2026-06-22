package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.PlayerMatchStatisticsRequest;
import com.example.trainingmatchservice.dto.response.PlayerMatchStatisticsResponse;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.PlayerMatchStatistics;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface PlayerMatchStatisticsMapper {

    @Mapping(target = "matchId", source = "match.id")
    PlayerMatchStatisticsResponse toResponse(PlayerMatchStatistics entity);

    @Mapping(target = "match", source = "matchId")
    PlayerMatchStatistics toEntity(PlayerMatchStatisticsRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(PlayerMatchStatisticsRequest request, @MappingTarget PlayerMatchStatistics entity);

    default Match mapMatch(Long id) {
        if (id == null) return null;
        Match match = new Match();
        match.setId(id);
        return match;
    }
}

