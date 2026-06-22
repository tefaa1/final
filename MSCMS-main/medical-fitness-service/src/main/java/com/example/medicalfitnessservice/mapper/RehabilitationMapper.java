package com.example.medicalfitnessservice.mapper;

import com.example.medicalfitnessservice.dto.request.RehabilitationRequest;
import com.example.medicalfitnessservice.dto.response.RehabilitationResponse;
import com.example.medicalfitnessservice.model.entity.Injury;
import com.example.medicalfitnessservice.model.entity.Rehabilitation;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface RehabilitationMapper {

    @Mapping(target = "injuryId", source = "injury.id")
    RehabilitationResponse toResponse(Rehabilitation entity);

    @Mapping(target = "injury", source = "injuryId")
    Rehabilitation toEntity(RehabilitationRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(RehabilitationRequest request, @MappingTarget Rehabilitation entity);

    default Injury mapInjury(Long id) {
        if (id == null) return null;
        Injury injury = new Injury();
        injury.setId(id);
        return injury;
    }
}

