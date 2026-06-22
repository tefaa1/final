package com.example.medicalfitnessservice.service;

import com.example.medicalfitnessservice.dto.request.DiagnosisRequest;
import com.example.medicalfitnessservice.dto.response.DiagnosisResponse;

import java.util.List;

public interface DiagnosisService {
    DiagnosisResponse createDiagnosis(DiagnosisRequest request);
    DiagnosisResponse updateDiagnosis(Long id, DiagnosisRequest request);
    void deleteDiagnosis(Long id);
    DiagnosisResponse getDiagnosisById(Long id);
    List<DiagnosisResponse> getAllDiagnoses();
}

