package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.TrainingAttendanceRequest;
import com.example.trainingmatchservice.dto.response.TrainingAttendanceResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.TrainingAttendanceMapper;
import com.example.trainingmatchservice.model.training.entity.TrainingAttendance;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import com.example.trainingmatchservice.repository.TrainingAttendanceRepository;
import com.example.trainingmatchservice.repository.TrainingSessionRepository;
import com.example.trainingmatchservice.service.TrainingAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TrainingAttendanceServiceImpl implements TrainingAttendanceService {

    private final TrainingAttendanceRepository trainingAttendanceRepository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final TrainingAttendanceMapper trainingAttendanceMapper;

    @Override
    public TrainingAttendanceResponse createTrainingAttendance(TrainingAttendanceRequest request) {
        TrainingSession session = getTrainingSession(request.trainingSessionId());
        TrainingAttendance attendance = trainingAttendanceMapper.toEntity(request);
        attendance.setTrainingSession(session);
        return trainingAttendanceMapper.toResponse(trainingAttendanceRepository.save(attendance));
    }

    @Override
    public TrainingAttendanceResponse updateTrainingAttendance(Long id, TrainingAttendanceRequest request) {
        TrainingAttendance attendance = getTrainingAttendance(id);
        if (request.trainingSessionId() != null) {
            attendance.setTrainingSession(getTrainingSession(request.trainingSessionId()));
        }
        trainingAttendanceMapper.updateFromRequest(request, attendance);
        return trainingAttendanceMapper.toResponse(trainingAttendanceRepository.save(attendance));
    }

    @Override
    public void deleteTrainingAttendance(Long id) {
        TrainingAttendance attendance = getTrainingAttendance(id);
        trainingAttendanceRepository.delete(attendance);
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingAttendanceResponse getTrainingAttendanceById(Long id) {
        return trainingAttendanceMapper.toResponse(getTrainingAttendance(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingAttendanceResponse> getAllTrainingAttendances() {
        return trainingAttendanceRepository.findAll()
                .stream()
                .map(trainingAttendanceMapper::toResponse)
                .toList();
    }

    private TrainingAttendance getTrainingAttendance(Long id) {
        return trainingAttendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training attendance not found with id " + id));
    }

    private TrainingSession getTrainingSession(Long id) {
        return trainingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training session not found with id " + id));
    }
}

