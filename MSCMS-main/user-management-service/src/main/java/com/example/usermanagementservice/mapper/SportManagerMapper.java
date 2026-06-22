package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.sportManagerReq.SportManagerRequest;
import com.example.usermanagementservice.dto.response.sportMangerRes.SportManagerResponse;
import com.example.usermanagementservice.dto.update.sportManagerUp.SportManagerUpdateRequest;
import com.example.usermanagementservice.model.entity.SportManager;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SportManagerMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "SPORT_MANGER")
    @Mapping(target = "teamManagerSet", ignore = true)
    SportManager toEntity(SportManagerRequest request);

    SportManagerResponse toResponse(SportManager sportManager);

    List<SportManagerResponse> toResponseList(List<SportManager> sportManagers);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(SportManagerUpdateRequest dto, @MappingTarget SportManager entity);
}

