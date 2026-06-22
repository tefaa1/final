package com.example.medicalfitnessservice.service.impl;

import com.example.medicalfitnessservice.dto.request.DiagnosisRequest;
import com.example.medicalfitnessservice.dto.response.DiagnosisResponse;
import com.example.medicalfitnessservice.exception.custom.ResourceNotFoundException;
import com.example.medicalfitnessservice.mapper.DiagnosisMapper;
import com.example.medicalfitnessservice.model.entity.Diagnosis;
import com.example.medicalfitnessservice.repository.DiagnosisRepository;
import com.example.medicalfitnessservice.repository.InjuryRepository;
import com.example.medicalfitnessservice.service.DiagnosisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DiagnosisServiceImpl implements DiagnosisService {

    private final DiagnosisRepository diagnosisRepository;
    private final InjuryRepository injuryRepository;
    private final DiagnosisMapper diagnosisMapper;

    @Override
    public DiagnosisResponse createDiagnosis(DiagnosisRequest request) {
        // Ensure injury exists
        injuryRepository.findById(request.injuryId())
                .orElseThrow(() -> new ResourceNotFoundException("Injury not found with id " + request.injuryId()));
        Diagnosis diagnosis = diagnosisMapper.toEntity(request);
        return diagnosisMapper.toResponse(diagnosisRepository.save(diagnosis));
    }

    @Override
    public DiagnosisResponse updateDiagnosis(Long id, DiagnosisRequest request) {
        Diagnosis diagnosis = getDiagnosis(id);
        if (request.injuryId() != null) {
            injuryRepository.findById(request.injuryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Injury not found with id " + request.injuryId()));
        }
        diagnosisMapper.updateFromRequest(request, diagnosis);
        return diagnosisMapper.toResponse(diagnosisRepository.save(diagnosis));
    }

    @Override
    public void deleteDiagnosis(Long id) {
        Diagnosis diagnosis = getDiagnosis(id);
        diagnosisRepository.delete(diagnosis);
    }

    @Override
    @Transactional(readOnly = true)
    public DiagnosisResponse getDiagnosisById(Long id) {
        return diagnosisMapper.toResponse(getDiagnosis(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiagnosisResponse> getAllDiagnoses() {
        return diagnosisRepository.findAll()
                .stream()
                .map(diagnosisMapper::toResponse)
                .toList();
    }

    private Diagnosis getDiagnosis(Long id) {
        return diagnosisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diagnosis not found with id " + id));
    }
}

