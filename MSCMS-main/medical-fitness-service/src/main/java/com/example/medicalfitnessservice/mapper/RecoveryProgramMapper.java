package com.example.medicalfitnessservice.mapper;

import com.example.medicalfitnessservice.dto.request.RecoveryProgramRequest;
import com.example.medicalfitnessservice.dto.response.RecoveryProgramResponse;
import com.example.medicalfitnessservice.model.entity.RecoveryProgram;
import com.example.medicalfitnessservice.model.entity.Rehabilitation;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface RecoveryProgramMapper {

    @Mapping(target = "rehabilitationId", source = "rehabilitation.id")
    RecoveryProgramResponse toResponse(RecoveryProgram entity);

    @Mapping(target = "rehabilitation", source = "rehabilitationId")
    RecoveryProgram toEntity(RecoveryProgramRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(RecoveryProgramRequest request, @MappingTarget RecoveryProgram entity);

    default Rehabilitation mapRehabilitation(Long id) {
        if (id == null) return null;
        Rehabilitation rehab = new Rehabilitation();
        rehab.setId(id);
        return rehab;
    }
}
