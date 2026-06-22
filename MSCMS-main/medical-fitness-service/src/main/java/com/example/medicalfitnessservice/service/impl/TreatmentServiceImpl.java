package com.example.medicalfitnessservice.service.impl;

import com.example.medicalfitnessservice.dto.request.TreatmentRequest;
import com.example.medicalfitnessservice.dto.response.TreatmentResponse;
import com.example.medicalfitnessservice.exception.custom.ResourceNotFoundException;
import com.example.medicalfitnessservice.mapper.TreatmentMapper;
import com.example.medicalfitnessservice.model.entity.Treatment;
import com.example.medicalfitnessservice.repository.InjuryRepository;
import com.example.medicalfitnessservice.repository.TreatmentRepository;
import com.example.medicalfitnessservice.service.TreatmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TreatmentServiceImpl implements TreatmentService {

    private final TreatmentRepository treatmentRepository;
    private final InjuryRepository injuryRepository;
    private final TreatmentMapper treatmentMapper;

    @Override
    public TreatmentResponse createTreatment(TreatmentRequest request) {
        injuryRepository.findById(request.injuryId())
                .orElseThrow(() -> new ResourceNotFoundException("Injury not found with id " + request.injuryId()));
        Treatment treatment = treatmentMapper.toEntity(request);
        return treatmentMapper.toResponse(treatmentRepository.save(treatment));
    }

    @Override
    public TreatmentResponse updateTreatment(Long id, TreatmentRequest request) {
        Treatment treatment = getTreatment(id);
        if (request.injuryId() != null) {
            injuryRepository.findById(request.injuryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Injury not found with id " + request.injuryId()));
        }
        treatmentMapper.updateFromRequest(request, treatment);
        return treatmentMapper.toResponse(treatmentRepository.save(treatment));
    }

    @Override
    public void deleteTreatment(Long id) {
        Treatment treatment = getTreatment(id);
        treatmentRepository.delete(treatment);
    }

    @Override
    @Transactional(readOnly = true)
    public TreatmentResponse getTreatmentById(Long id) {
        return treatmentMapper.toResponse(getTreatment(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TreatmentResponse> getAllTreatments() {
        return treatmentRepository.findAll()
                .stream()
                .map(treatmentMapper::toResponse)
                .toList();
    }

    private Treatment getTreatment(Long id) {
        return treatmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Treatment not found with id " + id));
    }
}

