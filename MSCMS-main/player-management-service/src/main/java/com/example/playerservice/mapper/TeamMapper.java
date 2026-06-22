package com.example.playerservice.mapper;

import com.example.playerservice.dto.request.TeamRequest;
import com.example.playerservice.dto.response.TeamResponse;
import com.example.playerservice.model.entity.Sport;
import com.example.playerservice.model.entity.Team;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TeamMapper {

    @Mapping(target = "sportId", source = "sport.id")
    TeamResponse toResponse(Team entity);

    @Mapping(target = "sport", source = "sportId")
    Team toEntity(TeamRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(TeamRequest request, @MappingTarget Team entity);

    default Sport mapSport(Long id) {
        if (id == null) return null;
        Sport sport = new Sport();
        sport.setId(id);
        return sport;
    }
}

