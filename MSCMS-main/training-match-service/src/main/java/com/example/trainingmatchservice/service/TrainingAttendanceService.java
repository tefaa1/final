package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.dto.request.TrainingAttendanceRequest;
import com.example.trainingmatchservice.dto.response.TrainingAttendanceResponse;

import java.util.List;

public interface TrainingAttendanceService {
    TrainingAttendanceResponse createTrainingAttendance(TrainingAttendanceRequest request);
    TrainingAttendanceResponse updateTrainingAttendance(Long id, TrainingAttendanceRequest request);
    void deleteTrainingAttendance(Long id);
    TrainingAttendanceResponse getTrainingAttendanceById(Long id);
    List<TrainingAttendanceResponse> getAllTrainingAttendances();
}

