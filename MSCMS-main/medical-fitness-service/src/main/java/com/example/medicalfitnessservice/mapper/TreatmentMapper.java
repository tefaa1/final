package com.example.medicalfitnessservice.mapper;

import com.example.medicalfitnessservice.dto.request.TreatmentRequest;
import com.example.medicalfitnessservice.dto.response.TreatmentResponse;
import com.example.medicalfitnessservice.model.entity.Injury;
import com.example.medicalfitnessservice.model.entity.Treatment;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TreatmentMapper {

    @Mapping(target = "injuryId", source = "injury.id")
    TreatmentResponse toResponse(Treatment entity);

    @Mapping(target = "injury", source = "injuryId")
    Treatment toEntity(TreatmentRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(TreatmentRequest request, @MappingTarget Treatment entity);

    default Injury mapInjury(Long id) {
        if (id == null) return null;
        Injury injury = new Injury();
        injury.setId(id);
        return injury;
    }
}

