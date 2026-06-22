package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.staffReq.StaffMemberRequest;
import com.example.usermanagementservice.dto.response.staffRes.AssistantCoachResponse;
import com.example.usermanagementservice.model.entity.staff.AssistantCoach;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AssistantCoachMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "STAFF")
    @Mapping(target = "staffrole", constant = "ASSISTANT_COACH")
    AssistantCoach toEntity(StaffMemberRequest request);

    @Mapping(source = "teamManager.id", target = "teamManagerId")
    AssistantCoachResponse toResponse(AssistantCoach assistantCoach);

    List<AssistantCoachResponse> toResponseList(List<AssistantCoach> assistantCoaches);
}