package com.example.playerservice.mapper;

import com.example.playerservice.dto.request.OuterPlayerRequest;
import com.example.playerservice.dto.response.OuterPlayerResponse;
import com.example.playerservice.model.entity.OuterPlayer;
import com.example.playerservice.model.entity.OuterTeam;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface OuterPlayerMapper {

    @Mapping(target = "outerTeamId", source = "outerTeam.id")
    OuterPlayerResponse toResponse(OuterPlayer entity);

    @Mapping(target = "outerTeam", source = "outerTeamId")
    OuterPlayer toEntity(OuterPlayerRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(OuterPlayerRequest request, @MappingTarget OuterPlayer entity);

    default OuterTeam mapOuterTeam(Long id) {
        if (id == null) return null;
        OuterTeam team = new OuterTeam();
        team.setId(id);
        return team;
    }
}

