package com.example.trainingmatchservice.mapper;

import com.example.trainingmatchservice.dto.request.TrainingAttendanceRequest;
import com.example.trainingmatchservice.dto.response.TrainingAttendanceResponse;
import com.example.trainingmatchservice.model.training.entity.TrainingAttendance;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TrainingAttendanceMapper {

    @Mapping(target = "trainingSessionId", source = "trainingSession.id")
    TrainingAttendanceResponse toResponse(TrainingAttendance entity);

    @Mapping(target = "trainingSession", source = "trainingSessionId")
    TrainingAttendance toEntity(TrainingAttendanceRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(TrainingAttendanceRequest request, @MappingTarget TrainingAttendance entity);

    default TrainingSession mapTrainingSession(Long id) {
        if (id == null) return null;
        TrainingSession session = new TrainingSession();
        session.setId(id);
        return session;
    }
}

