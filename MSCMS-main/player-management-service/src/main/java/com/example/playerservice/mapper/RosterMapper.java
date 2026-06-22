package com.example.playerservice.mapper;

import com.example.playerservice.dto.request.RosterRequest;
import com.example.playerservice.dto.response.RosterResponse;
import com.example.playerservice.model.entity.Roster;
import com.example.playerservice.model.entity.Team;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface RosterMapper {

    @Mapping(target = "teamId", source = "team.id")
    RosterResponse toResponse(Roster entity);

    @Mapping(target = "team", source = "teamId")
    Roster toEntity(RosterRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(RosterRequest request, @MappingTarget Roster entity);

    default Team mapTeam(Long id) {
        if (id == null) return null;
        Team team = new Team();
        team.setId(id);
        return team;
    }
}

