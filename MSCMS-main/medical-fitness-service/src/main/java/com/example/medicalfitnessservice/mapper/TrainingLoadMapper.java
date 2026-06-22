package com.example.medicalfitnessservice.mapper;

import com.example.medicalfitnessservice.dto.request.TrainingLoadRequest;
import com.example.medicalfitnessservice.dto.response.TrainingLoadResponse;
import com.example.medicalfitnessservice.model.entity.TrainingLoad;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TrainingLoadMapper {

    TrainingLoadResponse toResponse(TrainingLoad entity);

    TrainingLoad toEntity(TrainingLoadRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(TrainingLoadRequest request, @MappingTarget TrainingLoad entity);
}

