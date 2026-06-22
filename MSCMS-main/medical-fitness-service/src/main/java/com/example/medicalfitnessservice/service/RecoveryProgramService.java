package com.example.medicalfitnessservice.service;

import com.example.medicalfitnessservice.dto.request.RecoveryProgramRequest;
import com.example.medicalfitnessservice.dto.response.RecoveryProgramResponse;

import java.util.List;

public interface RecoveryProgramService {
    RecoveryProgramResponse createRecoveryProgram(RecoveryProgramRequest request);
    RecoveryProgramResponse updateRecoveryProgram(Long id, RecoveryProgramRequest request);
    void deleteRecoveryProgram(Long id);
    RecoveryProgramResponse getRecoveryProgramById(Long id);
    List<RecoveryProgramResponse> getAllRecoveryPrograms();
}

