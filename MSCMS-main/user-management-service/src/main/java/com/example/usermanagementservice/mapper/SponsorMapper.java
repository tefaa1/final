package com.example.usermanagementservice.mapper;
import com.example.usermanagementservice.dto.request.sponsorReq.SponsorRequest;
import com.example.usermanagementservice.dto.response.sponsorRes.SponsorResponse;
import com.example.usermanagementservice.dto.update.sponsorUp.SponsorUpdateRequest;
import com.example.usermanagementservice.model.entity.Sponsor;
import org.mapstruct.*;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SponsorMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", constant = "SPONSOR")
    Sponsor toEntity(SponsorRequest request);

    SponsorResponse toResponse(Sponsor sponsor);

    List<SponsorResponse> toResponseList(List<Sponsor> sponsors);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(SponsorUpdateRequest dto, @MappingTarget Sponsor entity);
}