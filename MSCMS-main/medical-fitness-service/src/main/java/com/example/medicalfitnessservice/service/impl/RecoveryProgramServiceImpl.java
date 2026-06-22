package com.example.medicalfitnessservice.service.impl;

import com.example.medicalfitnessservice.dto.request.RecoveryProgramRequest;
import com.example.medicalfitnessservice.dto.response.RecoveryProgramResponse;
import com.example.medicalfitnessservice.exception.custom.ResourceNotFoundException;
import com.example.medicalfitnessservice.mapper.RecoveryProgramMapper;
import com.example.medicalfitnessservice.model.entity.RecoveryProgram;
import com.example.medicalfitnessservice.repository.RecoveryProgramRepository;
import com.example.medicalfitnessservice.repository.RehabilitationRepository;
import com.example.medicalfitnessservice.service.RecoveryProgramService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class RecoveryProgramServiceImpl implements RecoveryProgramService {

    private final RecoveryProgramRepository recoveryProgramRepository;
    private final RehabilitationRepository rehabilitationRepository;
    private final RecoveryProgramMapper recoveryProgramMapper;

    @Override
    public RecoveryProgramResponse createRecoveryProgram(RecoveryProgramRequest request) {
        rehabilitationRepository.findById(request.rehabilitationId())
                .orElseThrow(() -> new ResourceNotFoundException("Rehabilitation not found with id " + request.rehabilitationId()));
        RecoveryProgram program = recoveryProgramMapper.toEntity(request);
        return recoveryProgramMapper.toResponse(recoveryProgramRepository.save(program));
    }

    @Override
    public RecoveryProgramResponse updateRecoveryProgram(Long id, RecoveryProgramRequest request) {
        RecoveryProgram program = getProgram(id);
        if (request.rehabilitationId() != null) {
            rehabilitationRepository.findById(request.rehabilitationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rehabilitation not found with id " + request.rehabilitationId()));
        }
        recoveryProgramMapper.updateFromRequest(request, program);
        return recoveryProgramMapper.toResponse(recoveryProgramRepository.save(program));
    }

    @Override
    public void deleteRecoveryProgram(Long id) {
        RecoveryProgram program = getProgram(id);
        recoveryProgramRepository.delete(program);
    }

    @Override
    @Transactional(readOnly = true)
    public RecoveryProgramResponse getRecoveryProgramById(Long id) {
        return recoveryProgramMapper.toResponse(getProgram(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecoveryProgramResponse> getAllRecoveryPrograms() {
        return recoveryProgramRepository.findAll()
                .stream()
                .map(recoveryProgramMapper::toResponse)
                .toList();
    }

    private RecoveryProgram getProgram(Long id) {
        return recoveryProgramRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recovery program not found with id " + id));
    }
}

