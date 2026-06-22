package com.example.usermanagementservice.mapper;

import com.example.usermanagementservice.dto.response.staffRes.StaffMemberResponse;
import com.example.usermanagementservice.dto.update.staffUp.StaffMemberUpdateRequest;
import com.example.usermanagementservice.model.entity.staff.StaffMember;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StaffMemberMapper {

    @Mapping(source = "teamManager.id", target = "teamManagerId")
    @Mapping(source = "staffrole", target = "staffRole")
    StaffMemberResponse toResponse(StaffMember staffMember);

    List<StaffMemberResponse> toResponseList(List<StaffMember> staffMembers);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(StaffMemberUpdateRequest dto, @MappingTarget StaffMember entity);
}