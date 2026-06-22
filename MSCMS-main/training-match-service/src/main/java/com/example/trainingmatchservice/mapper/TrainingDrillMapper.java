package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.TrainingDrillRequest;
import com.example.trainingmatchservice.dto.response.TrainingDrillResponse;
import com.example.trainingmatchservice.model.training.entity.TrainingDrill;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TrainingDrillMapper {

    @Mapping(target = "trainingSessionId", source = "trainingSession.id")
    TrainingDrillResponse toResponse(TrainingDrill entity);

    @Mapping(target = "trainingSession", source = "trainingSessionId")
    TrainingDrill toEntity(TrainingDrillRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(TrainingDrillRequest request, @MappingTarget TrainingDrill entity);

    default TrainingSession mapTrainingSession(Long id) {
        if (id == null) return null;
        TrainingSession session = new TrainingSession();
        session.setId(id);
        return session;
    }
}

