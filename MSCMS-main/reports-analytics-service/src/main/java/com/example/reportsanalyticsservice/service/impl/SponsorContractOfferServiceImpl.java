package com.example.reportsanalyticsservice.service.impl;

import com.example.reportsanalyticsservice.dto.request.SponsorContractOfferRequest;
import com.example.reportsanalyticsservice.dto.response.SponsorContractOfferResponse;
import com.example.reportsanalyticsservice.exception.custom.ResourceNotFoundException;
import com.example.reportsanalyticsservice.mapper.SponsorContractOfferMapper;
import com.example.reportsanalyticsservice.model.entity.SponsorContractOffer;
import com.example.reportsanalyticsservice.repository.SponsorContractOfferRepository;
import com.example.reportsanalyticsservice.service.SponsorContractOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SponsorContractOfferServiceImpl implements SponsorContractOfferService {

    private final SponsorContractOfferRepository repository;
    private final SponsorContractOfferMapper mapper;

    @Override
    public SponsorContractOfferResponse create(SponsorContractOfferRequest request) {
        SponsorContractOffer entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public SponsorContractOfferResponse update(Long id, SponsorContractOfferRequest request) {
        SponsorContractOffer entity = findEntity(id);
        mapper.updateFromRequest(request, entity);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Long id) { repository.delete(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public SponsorContractOfferResponse getById(Long id) { return mapper.toResponse(findEntity(id)); }

    @Override
    @Transactional(readOnly = true)
    public List<SponsorContractOfferResponse> getAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    private SponsorContractOffer findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SponsorContractOffer not found with id " + id));
    }
}
