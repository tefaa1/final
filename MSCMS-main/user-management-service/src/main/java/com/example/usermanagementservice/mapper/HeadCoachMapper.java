package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.staffReq.StaffMemberRequest;
import com.example.usermanagementservice.dto.response.staffRes.HeadCoachResponse;
import com.example.usermanagementservice.model.entity.staff.HeadCoach;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface HeadCoachMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "STAFF")
    @Mapping(target = "staffrole", constant = "HEAD_COACH")
    @Mapping(source = "yearsExperience", target = "yearsOfExperience")
    HeadCoach toEntity(StaffMemberRequest request);

    @Mapping(source = "teamManager.id", target = "teamManagerId")
    HeadCoachResponse toResponse(HeadCoach headCoach);

    List<HeadCoachResponse> toResponseList(List<HeadCoach> headCoaches);
}