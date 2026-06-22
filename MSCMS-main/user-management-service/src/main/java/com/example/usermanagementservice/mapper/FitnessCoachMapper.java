package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.staffReq.StaffMemberRequest;
import com.example.usermanagementservice.dto.response.staffRes.FitnessCoachResponse;
import com.example.usermanagementservice.model.entity.staff.FitnessCoach;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface FitnessCoachMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "STAFF")
    @Mapping(target = "staffrole", constant = "FITNESS_COACH")
    FitnessCoach toEntity(StaffMemberRequest request);

    @Mapping(source = "teamManager.id", target = "teamManagerId")
    FitnessCoachResponse toResponse(FitnessCoach fitnessCoach);

    List<FitnessCoachResponse> toResponseList(List<FitnessCoach> fitnessCoaches);
}