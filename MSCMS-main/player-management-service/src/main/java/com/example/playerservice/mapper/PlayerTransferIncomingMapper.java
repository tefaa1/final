package com.example.playerservice.mapper;

import com.example.playerservice.dto.request.PlayerTransferIncomingRequest;
import com.example.playerservice.dto.response.PlayerTransferIncomingResponse;
import com.example.playerservice.model.entity.OuterPlayer;
import com.example.playerservice.model.entity.OuterTeam;
import com.example.playerservice.model.entity.PlayerTransferIncoming;
import com.example.playerservice.model.entity.Team;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface PlayerTransferIncomingMapper {

    @Mapping(target = "outerPlayerId", source = "outerPlayer.id")
    @Mapping(target = "fromOuterTeamId", source = "fromTeam.id")
    @Mapping(target = "toTeamId", source = "toTeam.id")
    PlayerTransferIncomingResponse toResponse(PlayerTransferIncoming entity);

    @Mapping(target = "outerPlayer", source = "outerPlayerId")
    @Mapping(target = "fromTeam", source = "fromOuterTeamId")
    @Mapping(target = "toTeam", source = "toTeamId")
    PlayerTransferIncoming toEntity(PlayerTransferIncomingRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(PlayerTransferIncomingRequest request, @MappingTarget PlayerTransferIncoming entity);

    default OuterPlayer mapOuterPlayer(Long id) {
        if (id == null) return null;
        OuterPlayer player = new OuterPlayer();
        player.setId(id);
        return player;
    }

    default OuterTeam mapOuterTeam(Long id) {
        if (id == null) return null;
        OuterTeam team = new OuterTeam();
        team.setId(id);
        return team;
    }

    default Team mapTeam(Long id) {
        if (id == null) return null;
        Team team = new Team();
        team.setId(id);
        return team;
    }
}

