package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.TrainingPlanRequest;
import com.example.trainingmatchservice.dto.response.TrainingPlanResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.TrainingPlanMapper;
import com.example.trainingmatchservice.model.training.entity.TrainingPlan;
import com.example.trainingmatchservice.repository.TrainingPlanRepository;
import com.example.trainingmatchservice.service.TrainingPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TrainingPlanServiceImpl implements TrainingPlanService {

    private final TrainingPlanRepository trainingPlanRepository;
    private final TrainingPlanMapper trainingPlanMapper;

    @Override
    public TrainingPlanResponse createTrainingPlan(TrainingPlanRequest request) {
        TrainingPlan plan = trainingPlanMapper.toEntity(request);
        return trainingPlanMapper.toResponse(trainingPlanRepository.save(plan));
    }

    @Override
    public TrainingPlanResponse updateTrainingPlan(Long id, TrainingPlanRequest request) {
        TrainingPlan plan = getTrainingPlan(id);
        trainingPlanMapper.updateFromRequest(request, plan);
        return trainingPlanMapper.toResponse(trainingPlanRepository.save(plan));
    }

    @Override
    public void deleteTrainingPlan(Long id) {
        TrainingPlan plan = getTrainingPlan(id);
        trainingPlanRepository.delete(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingPlanResponse getTrainingPlanById(Long id) {
        return trainingPlanMapper.toResponse(getTrainingPlan(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingPlanResponse> getAllTrainingPlans() {
        return trainingPlanRepository.findAll()
                .stream()
                .map(trainingPlanMapper::toResponse)
                .toList();
    }

    private TrainingPlan getTrainingPlan(Long id) {
        return trainingPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training plan not found with id " + id));
    }
}

