package com.example.medicalfitnessservice.service.impl;

import com.example.medicalfitnessservice.dto.request.RehabilitationRequest;
import com.example.medicalfitnessservice.dto.response.RehabilitationResponse;
import com.example.medicalfitnessservice.exception.custom.ResourceNotFoundException;
import com.example.medicalfitnessservice.mapper.RehabilitationMapper;
import com.example.medicalfitnessservice.model.entity.Rehabilitation;
import com.example.medicalfitnessservice.repository.InjuryRepository;
import com.example.medicalfitnessservice.repository.RehabilitationRepository;
import com.example.medicalfitnessservice.service.RehabilitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class RehabilitationServiceImpl implements RehabilitationService {

    private final RehabilitationRepository rehabilitationRepository;
    private final InjuryRepository injuryRepository;
    private final RehabilitationMapper rehabilitationMapper;

    @Override
    public RehabilitationResponse createRehabilitation(RehabilitationRequest request) {
        injuryRepository.findById(request.injuryId())
                .orElseThrow(() -> new ResourceNotFoundException("Injury not found with id " + request.injuryId()));
        Rehabilitation rehab = rehabilitationMapper.toEntity(request);
        return rehabilitationMapper.toResponse(rehabilitationRepository.save(rehab));
    }

    @Override
    public RehabilitationResponse updateRehabilitation(Long id, RehabilitationRequest request) {
        Rehabilitation rehab = getRehabilitation(id);
        if (request.injuryId() != null) {
            injuryRepository.findById(request.injuryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Injury not found with id " + request.injuryId()));
        }
        rehabilitationMapper.updateFromRequest(request, rehab);
        return rehabilitationMapper.toResponse(rehabilitationRepository.save(rehab));
    }

    @Override
    public void deleteRehabilitation(Long id) {
        Rehabilitation rehab = getRehabilitation(id);
        rehabilitationRepository.delete(rehab);
    }

    @Override
    @Transactional(readOnly = true)
    public RehabilitationResponse getRehabilitationById(Long id) {
        return rehabilitationMapper.toResponse(getRehabilitation(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RehabilitationResponse> getAllRehabilitations() {
        return rehabilitationRepository.findAll()
                .stream()
                .map(rehabilitationMapper::toResponse)
                .toList();
    }

    private Rehabilitation getRehabilitation(Long id) {
        return rehabilitationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rehabilitation not found with id " + id));
    }
}

