package com.example.medicalfitnessservice.mapper;

import com.example.medicalfitnessservice.dto.request.FitnessTestRequest;
import com.example.medicalfitnessservice.dto.response.FitnessTestResponse;
import com.example.medicalfitnessservice.model.entity.FitnessTest;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface FitnessTestMapper {

    FitnessTestResponse toResponse(FitnessTest entity);

    FitnessTest toEntity(FitnessTestRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(FitnessTestRequest request, @MappingTarget FitnessTest entity);
}

