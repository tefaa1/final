package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.staffReq.StaffMemberRequest;
import com.example.usermanagementservice.dto.response.staffRes.PerformanceAnalystResponse;
import com.example.usermanagementservice.model.entity.staff.PerformanceAnalyst;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PerformanceAnalystMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "STAFF")
    @Mapping(target = "staffrole", constant = "PERFORMANCE_ANALYST")
    PerformanceAnalyst toEntity(StaffMemberRequest request);

    @Mapping(source = "teamManager.id", target = "teamManagerId")
    PerformanceAnalystResponse toResponse(PerformanceAnalyst performanceAnalyst);

    List<PerformanceAnalystResponse> toResponseList(List<PerformanceAnalyst> performanceAnalysts);
}