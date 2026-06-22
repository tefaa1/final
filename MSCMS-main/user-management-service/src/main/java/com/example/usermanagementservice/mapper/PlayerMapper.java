package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.playerReq.PlayerRequest;
import com.example.usermanagementservice.dto.response.playerRes.PlayerResponse;
import com.example.usermanagementservice.dto.update.playerUp.PlayerUpdateRequest;
import com.example.usermanagementservice.model.entity.Player;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PlayerMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "PLAYER")
    Player toEntity(PlayerRequest request);

    PlayerResponse toResponse(Player player);

    List<PlayerResponse> toResponseList(List<Player> players);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(PlayerUpdateRequest dto, @MappingTarget Player entity);
}