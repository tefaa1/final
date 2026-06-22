package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.staffReq.StaffMemberRequest;
import com.example.usermanagementservice.dto.response.staffRes.PhysiotherapistResponse;
import com.example.usermanagementservice.model.entity.staff.Physiotherapist;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PhysiotherapistMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "STAFF")
    @Mapping(target = "staffrole", constant = "PHYSIOTHERAPIST")
    Physiotherapist toEntity(StaffMemberRequest request);

    @Mapping(source = "teamManager.id", target = "teamManagerId")
    PhysiotherapistResponse toResponse(Physiotherapist physiotherapist);

    List<PhysiotherapistResponse> toResponseList(List<Physiotherapist> physiotherapists);
}
