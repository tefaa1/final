package com.example.medicalfitnessservice.mapper;

import com.example.medicalfitnessservice.dto.request.InjuryRequest;
import com.example.medicalfitnessservice.dto.response.InjuryResponse;
import com.example.medicalfitnessservice.model.entity.Injury;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface InjuryMapper {
    InjuryResponse toResponse(Injury entity);

    Injury toEntity(InjuryRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(InjuryRequest request, @MappingTarget Injury entity);
}

