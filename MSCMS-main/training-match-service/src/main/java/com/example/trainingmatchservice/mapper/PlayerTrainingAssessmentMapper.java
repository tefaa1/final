package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.PlayerTrainingAssessmentRequest;
import com.example.trainingmatchservice.dto.response.PlayerTrainingAssessmentResponse;
import com.example.trainingmatchservice.model.training.entity.PlayerTrainingAssessment;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface PlayerTrainingAssessmentMapper {

    @Mapping(target = "trainingSessionId", source = "trainingSession.id")
    PlayerTrainingAssessmentResponse toResponse(PlayerTrainingAssessment entity);

    @Mapping(target = "trainingSession", source = "trainingSessionId")
    PlayerTrainingAssessment toEntity(PlayerTrainingAssessmentRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(PlayerTrainingAssessmentRequest request, @MappingTarget PlayerTrainingAssessment entity);

    default TrainingSession mapTrainingSession(Long id) {
        if (id == null) return null;
        TrainingSession session = new TrainingSession();
        session.setId(id);
        return session;
    }
}

