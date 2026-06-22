package com.example.medicalfitnessservice.service.impl;

import com.example.medicalfitnessservice.dto.request.FitnessTestRequest;
import com.example.medicalfitnessservice.dto.response.FitnessTestResponse;
import com.example.medicalfitnessservice.exception.custom.ResourceNotFoundException;
import com.example.medicalfitnessservice.mapper.FitnessTestMapper;
import com.example.medicalfitnessservice.model.entity.FitnessTest;
import com.example.medicalfitnessservice.repository.FitnessTestRepository;
import com.example.medicalfitnessservice.model.enums.SportType;
import com.example.medicalfitnessservice.service.FitnessTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FitnessTestServiceImpl implements FitnessTestService {

    private final FitnessTestRepository fitnessTestRepository;
    private final FitnessTestMapper fitnessTestMapper;

    @Override
    public FitnessTestResponse createFitnessTest(FitnessTestRequest request) {
        FitnessTest test = fitnessTestMapper.toEntity(request);
        return fitnessTestMapper.toResponse(fitnessTestRepository.save(test));
    }

    @Override
    public FitnessTestResponse updateFitnessTest(Long id, FitnessTestRequest request) {
        FitnessTest test = getFitnessTest(id);
        fitnessTestMapper.updateFromRequest(request, test);
        return fitnessTestMapper.toResponse(fitnessTestRepository.save(test));
    }

    @Override
    public void deleteFitnessTest(Long id) {
        FitnessTest test = getFitnessTest(id);
        fitnessTestRepository.delete(test);
    }

    @Override
    @Transactional(readOnly = true)
    public FitnessTestResponse getFitnessTestById(Long id) {
        return fitnessTestMapper.toResponse(getFitnessTest(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FitnessTestResponse> getAllFitnessTests() {
        return fitnessTestRepository.findAll()
                .stream()
                .map(fitnessTestMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FitnessTestResponse> getFitnessTestsBySportType(SportType sportType) {
        return fitnessTestRepository.findBySportType(sportType)
                .stream()
                .map(fitnessTestMapper::toResponse)
                .toList();
    }

    private FitnessTest getFitnessTest(Long id) {
        return fitnessTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fitness test not found with id " + id));
    }
}

