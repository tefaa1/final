package com.example.medicalfitnessservice.service.impl;

import com.example.medicalfitnessservice.dto.request.TrainingLoadRequest;
import com.example.medicalfitnessservice.dto.response.TrainingLoadResponse;
import com.example.medicalfitnessservice.exception.custom.ResourceNotFoundException;
import com.example.medicalfitnessservice.mapper.TrainingLoadMapper;
import com.example.medicalfitnessservice.model.entity.TrainingLoad;
import com.example.medicalfitnessservice.repository.TrainingLoadRepository;
import com.example.medicalfitnessservice.service.TrainingLoadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TrainingLoadServiceImpl implements TrainingLoadService {

    private final TrainingLoadRepository trainingLoadRepository;
    private final TrainingLoadMapper trainingLoadMapper;

    @Override
    public TrainingLoadResponse createTrainingLoad(TrainingLoadRequest request) {
        TrainingLoad load = trainingLoadMapper.toEntity(request);
        return trainingLoadMapper.toResponse(trainingLoadRepository.save(load));
    }

    @Override
    public TrainingLoadResponse updateTrainingLoad(Long id, TrainingLoadRequest request) {
        TrainingLoad load = getTrainingLoad(id);
        trainingLoadMapper.updateFromRequest(request, load);
        return trainingLoadMapper.toResponse(trainingLoadRepository.save(load));
    }

    @Override
    public void deleteTrainingLoad(Long id) {
        TrainingLoad load = getTrainingLoad(id);
        trainingLoadRepository.delete(load);
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingLoadResponse getTrainingLoadById(Long id) {
        return trainingLoadMapper.toResponse(getTrainingLoad(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingLoadResponse> getAllTrainingLoads() {
        return trainingLoadRepository.findAll()
                .stream()
                .map(trainingLoadMapper::toResponse)
                .toList();
    }

    private TrainingLoad getTrainingLoad(Long id) {
        return trainingLoadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training load not found with id " + id));
    }
}

