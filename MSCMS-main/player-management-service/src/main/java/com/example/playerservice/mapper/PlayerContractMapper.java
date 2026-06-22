package com.example.playerservice.mapper;

import com.example.playerservice.dto.request.PlayerContractRequest;
import com.example.playerservice.dto.response.PlayerContractResponse;
import com.example.playerservice.model.entity.PlayerContract;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface PlayerContractMapper {

    PlayerContractResponse toResponse(PlayerContract entity);

    PlayerContract toEntity(PlayerContractRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(PlayerContractRequest request, @MappingTarget PlayerContract entity);
}

