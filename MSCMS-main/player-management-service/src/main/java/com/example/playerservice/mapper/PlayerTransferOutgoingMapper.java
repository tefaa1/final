package com.example.playerservice.mapper;

import com.example.playerservice.dto.request.PlayerTransferOutgoingRequest;
import com.example.playerservice.dto.response.PlayerTransferOutgoingResponse;
import com.example.playerservice.model.entity.OuterTeam;
import com.example.playerservice.model.entity.PlayerTransferOutgoing;
import com.example.playerservice.model.entity.Team;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface PlayerTransferOutgoingMapper {

    @Mapping(target = "fromTeamId", source = "fromTeam.id")
    @Mapping(target = "toOuterTeamId", source = "toTeam.id")
    PlayerTransferOutgoingResponse toResponse(PlayerTransferOutgoing entity);

    @Mapping(target = "fromTeam", source = "fromTeamId")
    @Mapping(target = "toTeam", source = "toOuterTeamId")
    PlayerTransferOutgoing toEntity(PlayerTransferOutgoingRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(PlayerTransferOutgoingRequest request, @MappingTarget PlayerTransferOutgoing entity);

    default Team mapTeam(Long id) {
        if (id == null) return null;
        Team team = new Team();
        team.setId(id);
        return team;
    }

    default OuterTeam mapOuterTeam(Long id) {
        if (id == null) return null;
        OuterTeam team = new OuterTeam();
        team.setId(id);
        return team;
    }
}

