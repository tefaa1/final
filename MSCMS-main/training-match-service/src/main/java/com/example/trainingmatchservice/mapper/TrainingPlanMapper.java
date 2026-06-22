package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.TrainingPlanRequest;
import com.example.trainingmatchservice.dto.response.TrainingPlanResponse;
import com.example.trainingmatchservice.model.training.entity.TrainingPlan;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TrainingPlanMapper {
    TrainingPlanResponse toResponse(TrainingPlan entity);

    TrainingPlan toEntity(TrainingPlanRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(TrainingPlanRequest request, @MappingTarget TrainingPlan entity);
}

