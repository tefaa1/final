package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.teamMangerReq.TeamManagerRequest;
import com.example.usermanagementservice.dto.response.teamManagerRes.TeamManagerResponse;
import com.example.usermanagementservice.dto.update.teamManagerUp.TeamManagerUpdateRequest;
import com.example.usermanagementservice.model.entity.TeamManager;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TeamManagerMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "TEAM_MANGER")
    @Mapping(target = "sportManager", ignore = true)
    @Mapping(target = "staffMembers", ignore = true)
    TeamManager toEntity(TeamManagerRequest request);

    @Mapping(source = "sportManager.id", target = "sportManagerId")
    TeamManagerResponse toResponse(TeamManager teamManager);

    List<TeamManagerResponse> toResponseList(List<TeamManager> teamManagers);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(TeamManagerUpdateRequest dto, @MappingTarget TeamManager entity);
}