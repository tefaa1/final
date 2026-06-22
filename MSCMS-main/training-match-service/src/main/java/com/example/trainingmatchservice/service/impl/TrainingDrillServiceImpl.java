package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.TrainingDrillRequest;
import com.example.trainingmatchservice.dto.response.TrainingDrillResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.TrainingDrillMapper;
import com.example.trainingmatchservice.model.training.entity.TrainingDrill;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import com.example.trainingmatchservice.repository.TrainingDrillRepository;
import com.example.trainingmatchservice.repository.TrainingSessionRepository;
import com.example.trainingmatchservice.service.TrainingDrillService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TrainingDrillServiceImpl implements TrainingDrillService {

    private final TrainingDrillRepository trainingDrillRepository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final TrainingDrillMapper trainingDrillMapper;

    @Override
    public TrainingDrillResponse createTrainingDrill(TrainingDrillRequest request) {
        TrainingSession session = getTrainingSession(request.trainingSessionId());
        TrainingDrill drill = trainingDrillMapper.toEntity(request);
        drill.setTrainingSession(session);
        return trainingDrillMapper.toResponse(trainingDrillRepository.save(drill));
    }

    @Override
    public TrainingDrillResponse updateTrainingDrill(Long id, TrainingDrillRequest request) {
        TrainingDrill drill = getTrainingDrill(id);
        if (request.trainingSessionId() != null) {
            drill.setTrainingSession(getTrainingSession(request.trainingSessionId()));
        }
        trainingDrillMapper.updateFromRequest(request, drill);
        return trainingDrillMapper.toResponse(trainingDrillRepository.save(drill));
    }

    @Override
    public void deleteTrainingDrill(Long id) {
        TrainingDrill drill = getTrainingDrill(id);
        trainingDrillRepository.delete(drill);
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingDrillResponse getTrainingDrillById(Long id) {
        return trainingDrillMapper.toResponse(getTrainingDrill(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingDrillResponse> getAllTrainingDrills() {
        return trainingDrillRepository.findAll()
                .stream()
                .map(trainingDrillMapper::toResponse)
                .toList();
    }

    private TrainingDrill getTrainingDrill(Long id) {
        return trainingDrillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training drill not found with id " + id));
    }

    private TrainingSession getTrainingSession(Long id) {
        return trainingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training session not found with id " + id));
    }
}

