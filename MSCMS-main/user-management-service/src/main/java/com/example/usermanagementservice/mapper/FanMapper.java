package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.fanReq.FanRequest;
import com.example.usermanagementservice.dto.response.fanRes.FanResponse;
import com.example.usermanagementservice.dto.update.fanUp.FanUpdateRequest;
import com.example.usermanagementservice.model.entity.Fan;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface FanMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "FAN")
    Fan toEntity(FanRequest request);

    FanResponse toResponse(Fan fan);

    List<FanResponse> toResponseList(List<Fan> fans);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(FanUpdateRequest dto, @MappingTarget Fan entity);
}