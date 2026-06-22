package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.TrainingSessionRequest;
import com.example.trainingmatchservice.dto.response.TrainingSessionResponse;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TrainingSessionMapper {

    TrainingSessionResponse toResponse(TrainingSession entity);

    TrainingSession toEntity(TrainingSessionRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(TrainingSessionRequest request, @MappingTarget TrainingSession entity);
}

