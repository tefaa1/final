package com.example.medicalfitnessservice.service.impl;

import com.example.medicalfitnessservice.dto.request.InjuryRequest;
import com.example.medicalfitnessservice.dto.response.InjuryResponse;
import com.example.medicalfitnessservice.exception.custom.ResourceNotFoundException;
import com.example.medicalfitnessservice.mapper.InjuryMapper;
import com.example.medicalfitnessservice.model.entity.Injury;
import com.example.medicalfitnessservice.repository.InjuryRepository;
import com.example.medicalfitnessservice.service.InjuryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InjuryServiceImpl implements InjuryService {

    private final InjuryRepository injuryRepository;
    private final InjuryMapper injuryMapper;

    @Override
    public InjuryResponse createInjury(InjuryRequest request) {
        Injury injury = injuryMapper.toEntity(request);
        return injuryMapper.toResponse(injuryRepository.save(injury));
    }

    @Override
    public InjuryResponse updateInjury(Long id, InjuryRequest request) {
        Injury injury = getInjury(id);
        injuryMapper.updateFromRequest(request, injury);
        return injuryMapper.toResponse(injuryRepository.save(injury));
    }

    @Override
    public void deleteInjury(Long id) {
        Injury injury = getInjury(id);
        injuryRepository.delete(injury);
    }

    @Override
    @Transactional(readOnly = true)
    public InjuryResponse getInjuryById(Long id) {
        return injuryMapper.toResponse(getInjury(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InjuryResponse> getAllInjuries() {
        return injuryRepository.findAll()
                .stream()
                .map(injuryMapper::toResponse)
                .toList();
    }

    private Injury getInjury(Long id) {
        return injuryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Injury not found with id " + id));
    }
}

