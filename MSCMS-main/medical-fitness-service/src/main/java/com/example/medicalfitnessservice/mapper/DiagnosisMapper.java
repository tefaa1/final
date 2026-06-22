package com.example.medicalfitnessservice.mapper;

import com.example.medicalfitnessservice.dto.request.DiagnosisRequest;
import com.example.medicalfitnessservice.dto.response.DiagnosisResponse;
import com.example.medicalfitnessservice.model.entity.Diagnosis;
import com.example.medicalfitnessservice.model.entity.Injury;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface DiagnosisMapper {

    @Mapping(target = "injuryId", source = "injury.id")
    DiagnosisResponse toResponse(Diagnosis entity);

    @Mapping(target = "injury", source = "injuryId")
    Diagnosis toEntity(DiagnosisRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(DiagnosisRequest request, @MappingTarget Diagnosis entity);

    default Injury mapInjury(Long id) {
        if (id == null) return null;
        Injury injury = new Injury();
        injury.setId(id);
        return injury;
    }
}

