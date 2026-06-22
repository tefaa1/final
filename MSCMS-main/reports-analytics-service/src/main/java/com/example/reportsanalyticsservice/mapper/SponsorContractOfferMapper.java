package com.example.reportsanalyticsservice.mapper;

import com.example.reportsanalyticsservice.dto.request.SponsorContractOfferRequest;
import com.example.reportsanalyticsservice.dto.response.SponsorContractOfferResponse;
import com.example.reportsanalyticsservice.model.entity.SponsorContractOffer;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface SponsorContractOfferMapper {
    SponsorContractOfferResponse toResponse(SponsorContractOffer entity);
    SponsorContractOffer toEntity(SponsorContractOfferRequest request);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(SponsorContractOfferRequest request, @MappingTarget SponsorContractOffer entity);
}
