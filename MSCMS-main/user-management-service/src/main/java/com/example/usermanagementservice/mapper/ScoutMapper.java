package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.scoutReq.ScoutRequest;
import com.example.usermanagementservice.dto.response.scoutRes.ScoutResponse;
import com.example.usermanagementservice.dto.update.scoutUp.ScoutUpdateRequest;
import com.example.usermanagementservice.model.entity.Scout;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ScoutMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "SCOUT")
    Scout toEntity(ScoutRequest request);

    ScoutResponse toResponse(Scout scout);

    List<ScoutResponse> toResponseList(List<Scout> scouts);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(ScoutUpdateRequest dto, @MappingTarget Scout entity);
}