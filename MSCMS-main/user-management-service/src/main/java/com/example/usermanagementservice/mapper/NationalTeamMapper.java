package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.nationalTeamReq.NationalTeamRequest;
import com.example.usermanagementservice.dto.response.nationalTeamReS.NationalTeamResponse;
import com.example.usermanagementservice.dto.update.nationalTeamUp.NationalTeamUpdateRequest;
import com.example.usermanagementservice.model.entity.NationalTeam;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface NationalTeamMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "NATIONAL_TEAM")
    NationalTeam toEntity(NationalTeamRequest request);

    NationalTeamResponse toResponse(NationalTeam nationalTeam);

    List<NationalTeamResponse> toResponseList(List<NationalTeam> nationalTeams);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(NationalTeamUpdateRequest dto, @MappingTarget NationalTeam entity);
}